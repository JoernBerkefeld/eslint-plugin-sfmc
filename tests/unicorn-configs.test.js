import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import unicorn from 'eslint-plugin-unicorn';
import sfmc from '../src/index.js';

// Point at an isolated ESLint lib/api.js to exercise the actual minimum engine.
const enginePath = process.env.SFMC_TEST_ESLINT_PATH;
const expectedVersion = process.env.SFMC_TEST_ESLINT_VERSION;
assert.equal(Boolean(enginePath), Boolean(expectedVersion), 'Set both ESLint test variables');
if (enginePath) {
    assert.ok(path.isAbsolute(enginePath), 'ESLint override must be an absolute module path');
}
const engineUrl = enginePath ? pathToFileURL(enginePath).href : import.meta.resolve('eslint');
const { ESLint } = await import(engineUrl);
const engineRequire = createRequire(engineUrl);
const { defineConfig } = engineRequire('eslint/config');
const cwd = fileURLToPath(new URL('..', import.meta.url));
const objectNames = [
    'ampscript',
    'ssjs',
    'ampscript-next',
    'ssjs-next',
    'unicorn-ssjs',
    'unicorn-ssjs-embedded',
];
const arrayNames = [
    'recommended',
    'embedded',
    'strict',
    'recommended-next',
    'embedded-next',
    'strict-next',
];
const standaloneOff = sfmc.configs['unicorn-ssjs'];
const embeddedOff = sfmc.configs['unicorn-ssjs-embedded'];
const probeRule = 'unicorn/prefer-includes';

function engine(config) {
    return new ESLint({ cwd, overrideConfigFile: true, overrideConfig: config });
}

function severity(config, rule) {
    return config?.rules?.[rule]?.[0] ?? 0;
}

async function messages(linter, code, filePath) {
    const [result] = await linter.lintText(code, { filePath });
    assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
    assert.ok(result.messages.every((message) => !message.message.includes('ignored')));
    return result.messages;
}

test('declared ESLint minimum and selected engine are explicit', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(manifest.peerDependencies.eslint, '>=10.4.0');
    if (expectedVersion) {
        assert.equal(ESLint.version, expectedVersion);
    }
    const [major, minor] = ESLint.version.split('.').map(Number);
    assert.ok(major > 10 || (major === 10 && minor >= 4));
});

test('all twelve public shapes and optional consumer registration stay unchanged', () => {
    assert.deepEqual(new Set(Object.keys(sfmc.configs)), new Set([...objectNames, ...arrayNames]));
    for (const name of objectNames) {
        assert.equal(Array.isArray(sfmc.configs[name]), false, name);
        assert.equal(Object.getPrototypeOf(sfmc.configs[name]), Object.prototype, name);
    }
    for (const name of arrayNames) {
        assert.ok(Array.isArray(sfmc.configs[name]), name);
    }
    assert.deepEqual(standaloneOff.rules, embeddedOff.rules);
    assert.ok(Object.keys(standaloneOff.rules).length > 0);
    for (const config of [standaloneOff, embeddedOff]) {
        assert.deepEqual(new Set(Object.keys(config)), new Set(['files', 'name', 'rules']));
        assert.ok(Object.values(config.rules).every((value) => value === 'off'));
    }
    assert.deepEqual(standaloneOff.files, ['**/*.ssjs']);
    assert.deepEqual(embeddedOff.files, ['**/*.html/*.js']);
});

// Raw arrays spread multi-block presets; defineConfig accepts objects AND arrays directly.
for (const style of ['raw', 'defineConfig']) {
    for (const name of [...objectNames, ...arrayNames]) {
        test(`${style}: ${name} retains its effective scopes`, async () => {
            const preset = sfmc.configs[name];
            const registration = { plugins: { unicorn } };
            const config =
                style === 'raw'
                    ? [registration, ...(Array.isArray(preset) ? preset : [preset])]
                    : defineConfig(registration, preset);
            const linter = engine(config);
            const next = name.endsWith('-next');
            const embedded = name.startsWith('embedded') || name.startsWith('strict');
            const isStandalone = !name.startsWith('embedded') && !name.startsWith('unicorn');
            const isAmp = isStandalone && !name.startsWith('ssjs');
            const isSsjs = isStandalone && !name.startsWith('ampscript');
            for (const file of ['sample.amp', 'sample.ampscript', 'mail.html/0_block.amp']) {
                const active = isAmp || (file.includes('.html/') && embedded);
                const effective = await linter.calculateConfigForFile(file);
                assert.equal(
                    severity(effective, 'sfmc/amp-no-unknown-function'),
                    active ? 2 : 0,
                    file,
                );
                assert.equal(
                    severity(effective, 'sfmc/amp-no-mcn-unsupported'),
                    active && next ? 2 : 0,
                    file,
                );
            }
            for (const file of ['sample.ssjs', 'mail.html/0_block.js']) {
                const active = file.endsWith('.ssjs') ? isSsjs : embedded;
                const effective = await linter.calculateConfigForFile(file);
                assert.equal(
                    severity(effective, 'sfmc/ssjs-no-mcn-unsupported'),
                    active && next ? 2 : 0,
                    file,
                );
                assert.equal(
                    severity(effective, 'sfmc/ssjs-no-unknown-function'),
                    active && !next ? 2 : 0,
                    file,
                );
                if (active) {
                    assert.equal(effective.languageOptions.ecmaVersion, 5);
                    assert.equal(effective.languageOptions.sourceType, 'script');
                    assert.ok('Platform' in effective.languageOptions.globals);
                }
            }
            for (const file of ['sample.hbs', 'mail.html/0_block.hbs']) {
                const active = next && Array.isArray(preset);
                const effective = await linter.calculateConfigForFile(file);
                assert.equal(
                    severity(effective, 'sfmc/hbs-no-unknown-helper'),
                    active ? 2 : 0,
                    file,
                );
            }
            const html = await linter.calculateConfigForFile('mail.html');
            assert.equal(html?.processor, embedded ? sfmc.processors.sfmc : undefined);
            for (const [file, rule, level] of [
                ['mail.html/0_mso-comments.mso', 'mso/valid-mso-condition', 2],
                ['mail.html/0_document.msohtml', 'mso/table-presentation-role', 1],
            ]) {
                assert.equal(
                    severity(await linter.calculateConfigForFile(file), rule),
                    embedded ? level : 0,
                );
            }
            for (const file of ['ordinary.js', 'ordinary.mjs']) {
                const effective = await linter.calculateConfigForFile(file);
                assert.ok(
                    Object.keys(effective.rules ?? {}).every(
                        (rule) => !/^(?:sfmc|mso|unicorn)\//u.test(rule),
                    ),
                    file,
                );
            }
        });
    }

    test(`${style}: upstream recommended composition suppresses only SSJS scopes`, async () => {
        // Scope upstream JS rules away from the AMPscript/Handlebars/MSO parsers.
        const upstream = {
            ...unicorn.configs.recommended,
            files: ['**/*.js', '**/*.mjs', '**/*.ssjs'],
        };
        const config =
            style === 'raw'
                ? [upstream, ...sfmc.configs.strict, standaloneOff, embeddedOff]
                : defineConfig(upstream, sfmc.configs.strict, standaloneOff, embeddedOff);
        const linter = engine(config);
        for (const file of ['sample.ssjs', 'mail.html/0_block.js']) {
            const effective = await linter.calculateConfigForFile(file);
            for (const rule of Object.keys(standaloneOff.rules)) {
                assert.equal(severity(effective, rule), 0, `${file}: ${rule}`);
            }
        }
        const witness =
            'var text = "example"; if (text.indexOf("amp") !== -1) { text = "matched"; }';
        for (const file of ['ordinary.js', 'ordinary.mjs']) {
            const effective = await linter.calculateConfigForFile(file);
            for (const rule of Object.keys(standaloneOff.rules)) {
                assert.equal(severity(effective, rule), 2, `${file}: ${rule}`);
            }
            assert.ok(
                (await messages(linter, witness, file)).some(
                    (message) => message.ruleId === probeRule,
                ),
            );
        }
        for (const [file, code] of [
            ['sample.ssjs', witness],
            ['mail.html', `<script runat="server">${witness}</script>`],
        ]) {
            assert.ok(
                (await messages(linter, code, file)).every(
                    (message) => message.ruleId !== probeRule,
                ),
            );
        }
        // A positive processor control rules out a vacuous HTML suppression result.
        const baseline = engine([upstream, ...sfmc.configs.strict]);
        assert.ok(
            (
                await messages(baseline, `<script runat="server">${witness}</script>`, 'mail.html')
            ).some((message) => message.ruleId === probeRule),
        );
    });
}

test('actual HTML processor retains Next Handlebars and embedded MSO diagnostics without Unicorn', async () => {
    const html =
        '<!--[if mso]><table><tr><td>{{unknownHelperForConfigTest "x"}}</td></tr></table><![endif]-->';
    for (const name of ['embedded', 'strict', 'embedded-next', 'strict-next']) {
        const result = await messages(engine(sfmc.configs[name]), html, 'mail.html');
        assert.ok(
            result.some((message) => message.ruleId === 'mso/table-presentation-role'),
            name,
        );
        assert.equal(
            result.some((message) => message.ruleId === 'sfmc/hbs-no-unknown-helper'),
            name.endsWith('-next'),
            name,
        );
    }
});
