import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function validateReleaseTag(tag, version, head, taggedCommit) {
    assert.equal(tag, `v${version}`, 'Release tag must match package.json version');
    assert.equal(head, taggedCommit, 'Checkout must be the actual release tag commit');
}

export function validateDocumentation(plugin, metadata, root) {
    assert.equal(plugin.meta.name, metadata.name);
    assert.equal(plugin.meta.version, metadata.version);
    const paths = [];
    for (const [id, rule] of Object.entries(plugin.rules)) {
        assert.match(id, /^(?:amp|ssjs|hbs)-[a-z0-9-]+$/);
        const document = `docs/rules/${id.replace(/-/, '/')}.md`;
        // ESLint rule links target whole pages, never unverified fragments or local paths.
        assert.equal(
            rule.meta.docs.url,
            `https://github.com/JoernBerkefeld/eslint-plugin-sfmc/blob/v${metadata.version}/${document}`,
        );
        assert.ok(
            readFileSync(path.resolve(root, document), 'utf8').trim(),
            `Empty documentation: ${document}`,
        );
        paths.push(document);
    }
    assert.ok(paths.length > 0, 'No exported rule documentation');
    return paths;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const root = fileURLToPath(new URL('../', import.meta.url));
    const metadata = JSON.parse(readFileSync(path.resolve(root, 'package.json'), 'utf8'));
    const tag = process.env.RELEASE_TAG;
    assert.equal(tag, `v${metadata.version}`, 'Release tag must match package.json version');
    const git = (...arguments_) =>
        execFileSync('git', arguments_, { cwd: root, encoding: 'utf8' }).trim();
    const tagReference = `refs/tags/${tag}`;
    validateReleaseTag(
        tag,
        metadata.version,
        git('rev-parse', 'HEAD'),
        git('rev-parse', tagReference + '^{commit}'),
    );
    assert.equal(
        JSON.parse(git('show', `${tagReference}:package.json`)).version,
        metadata.version,
        'Tagged package metadata must match checkout metadata',
    );
    const { default: plugin } = await import('../src/index.js');
    for (const document of validateDocumentation(plugin, metadata, root)) {
        // Verify the page exists in the tag itself, not just as an untracked checkout file.
        assert.ok(
            git('show', `${tagReference}:${document}`),
            `Missing tagged documentation: ${document}`,
        );
    }
    process.stdout.write(`Validated release documentation for ${tag}\n`);
}
