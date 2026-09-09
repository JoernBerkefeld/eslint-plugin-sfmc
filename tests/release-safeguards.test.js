import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import plugin from '../src/index.js';
import {
    validateDocumentation,
    validateReleaseTag,
} from '../scripts/validate-release-documentation.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const metadata = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

test('release gate rejects missing/mismatched tags and wrong checkout commits', () => {
    validateReleaseTag(`v${metadata.version}`, metadata.version, 'abc', 'abc');
    for (const tag of [undefined, metadata.version, 'v0.0.0', 'main']) {
        assert.throws(() => validateReleaseTag(tag, metadata.version, 'abc', 'abc'), /Release tag/);
    }
    assert.throws(
        () => validateReleaseTag(`v${metadata.version}`, metadata.version, 'abc', 'def'),
        /actual release tag/,
    );
    assert.throws(
        () =>
            execFileSync(process.execPath, ['scripts/validate-release-documentation.js'], {
                cwd: root,
                env: { ...process.env, RELEASE_TAG: 'v0.0.0' },
                stdio: 'pipe',
            }),
        (ex) => ex.status !== 0 && ex.stderr.toString().includes('Release tag must match'),
    );
});

test('documentation gate rejects identity drift, missing pages, foreign URLs and fragments', () => {
    assert.equal(validateDocumentation(plugin, metadata, root).length, 52);
    assert.throws(() => validateDocumentation(plugin, { ...metadata, version: '0.0.0' }, root));
    const id = 'amp-arg-types';
    const original = plugin.rules[id];
    for (const url of [
        original.meta.docs.url + '#missing',
        'file:///local/doc.md',
        original.meta.docs.url.replace('/v', '/main/v'),
    ]) {
        const changed = {
            ...plugin,
            rules: {
                [id]: {
                    ...original,
                    meta: { ...original.meta, docs: { ...original.meta.docs, url } },
                },
            },
        };
        assert.throws(() => validateDocumentation(changed, metadata, root));
    }
    const empty = mkdtempSync(path.join(tmpdir(), 'sfmc-missing-docs-'));
    try {
        assert.throws(() => validateDocumentation(plugin, metadata, empty), /ENOENT/);
    } finally {
        rmSync(empty, { recursive: true, force: true });
    }
});

test('real npm artifact loads its own identity and docs outside the source tree and cwd', () => {
    const temporary = mkdtempSync(path.join(tmpdir(), 'sfmc-packed-'));
    try {
        // Ignore prepare (husky); packing and validation must never install or fetch anything.
        assert.ok(
            process.env.npm_execpath,
            'Run this test through npm test or npm run test:release',
        );
        const [packed] = JSON.parse(
            execFileSync(
                process.execPath,
                [
                    process.env.npm_execpath,
                    'pack',
                    '--json',
                    '--offline',
                    '--ignore-scripts',
                    '--no-workspaces',
                    '--pack-destination',
                    temporary,
                ],
                { cwd: root, encoding: 'utf8' },
            ),
        );
        assert.equal(packed.version, metadata.version);
        for (const path of [
            'package.json',
            'src/index.js',
            ...validateDocumentation(plugin, metadata, root),
        ]) {
            assert.ok(
                packed.files.some((file) => file.path === path),
                `Not packed: ${path}`,
            );
        }
        // A relative archive avoids GNU tar interpreting a Windows drive as a remote host.
        execFileSync('tar', ['-xzf', packed.filename], { cwd: temporary });
        const extracted = path.join(temporary, 'package');
        // Only dependencies are shared: the plugin entry and its package.json come from the tarball.
        symlinkSync(
            path.join(root, 'node_modules'),
            path.join(extracted, 'node_modules'),
            'junction',
        );
        const entry = pathToFileURL(path.join(extracted, 'src/index.js')).href;
        const probe = `import plugin from ${JSON.stringify(entry)}; process.stdout.write(JSON.stringify({ meta: plugin.meta, rules: Object.fromEntries(Object.entries(plugin.rules).map(([id, rule]) => [id, { meta: { docs: rule.meta.docs } }])) }));`;
        const load = () =>
            JSON.parse(
                execFileSync(process.execPath, ['--input-type=module', '-e', probe], {
                    cwd: tmpdir(),
                    encoding: 'utf8',
                }),
            );
        validateDocumentation(load(), metadata, extracted);
        // A distinct prospective version proves runtime identity is not hardcoded or source-derived.
        const prospective = { ...metadata, version: '99.98.97-test.1' };
        writeFileSync(path.join(extracted, 'package.json'), JSON.stringify(prospective) + '\n');
        validateDocumentation(load(), prospective, extracted);
    } finally {
        rmSync(temporary, { recursive: true, force: true });
    }
});
