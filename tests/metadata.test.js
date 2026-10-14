import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { ESLint, Linter } from 'eslint';
import * as ampParser from '../src/ampscript-parser.js';
import { parse as sharedParse } from 'ampscript-parser';
import mso from 'eslint-plugin-mso-email';
import { FUNCTIONS } from 'ampscript-data';
import sfmc from '../src/index.js';
import { isBooleanLikeParameter } from '../src/rules/amp/prefer-boolean-literal.js';

const require = createRequire(import.meta.url);
const metadata = require('../package.json');
const root = new URL('../', import.meta.url);
const base = `https://github.com/JoernBerkefeld/eslint-plugin-sfmc/blob/v${metadata.version}/`;

test('AMPscript adapter separates ESLint comment tokens from canonical AST nodes', () => {
    const code = '%%[\r\n/* first\r\nsecond */\r\n/*tail*/\r\n]%%';
    const original = sharedParse(code).children.at(0).statements;
    const { ast } = ampParser.parseForESLint(code);
    const nodes = ast.body[0].statements;
    assert.equal(ast.comments.length, 2);
    for (const [index, node] of nodes.entries()) {
        const token = ast.comments[index];
        assert.equal(node.type, 'Comment');
        assert.equal(node.value, original[index].value);
        assert.equal(node.start, original[index].start);
        assert.equal(node.end, original[index].end);
        assert.notEqual(token, node);
        assert.equal(token.type, 'Block');
        assert.equal(token.value, node.value.slice(2, -2));
        assert.deepEqual(token.range, [node.start, node.end]);
        assert.deepEqual(token.loc, node.loc);
        assert.notEqual(token.range, node.range);
        assert.notEqual(token.loc, node.loc);
        assert.equal(code.slice(...token.range), node.value);
    }
    assert.deepEqual(ast.comments[0].loc, {
        start: { line: 2, column: 0 },
        end: { line: 3, column: 9 },
    });
    assert.equal(ampParser.parseForESLint('%%[/*tail]%%').ast.comments[0].value, 'tail');
    assert.equal(ampParser.parseForESLint('%%[/**/]%%').ast.comments[0].value, '');
});

test('core spaced-comment validates and fixes AMPscript comments at original positions', () => {
    const linter = new Linter();
    const config = {
        languageOptions: { parser: ampParser },
        rules: { 'spaced-comment': ['error', 'always', { block: { balanced: true } }] },
    };
    assert.deepEqual(linter.verify('%%[/* good */]%%', config), []);
    const code = '%%[\n/*bad*/\n]%%';
    const messages = linter.verify(code, config);
    assert.equal(messages.length, 2);
    for (const message of messages) {
        assert.equal(message.ruleId, 'spaced-comment');
        assert.equal(message.line, 2);
        assert.equal(message.column, 1);
        assert.equal(message.endLine, 2);
        assert.equal(message.endColumn, 8);
    }
    assert.deepEqual(
        messages.map((message) => message.fix.range),
        [
            [6, 6],
            [9, 9],
        ],
    );
    const fixed = linter.verifyAndFix(code, config);
    assert.equal(fixed.output, '%%[\n/* bad */\n]%%');
    assert.equal(fixed.fixed, true);
    assert.deepEqual(fixed.messages, []);
});

test('all public rules retain metadata and link to existing release-owned documentation', async () => {
    assert.equal(sfmc.meta.version, metadata.version);
    assert.equal(sfmc.meta.name, metadata.name);
    assert.equal(Object.keys(sfmc.rules).length, 53);
    const readme = readFileSync(new URL('README.md', root), 'utf8');
    for (const [id, rule] of Object.entries(sfmc.rules)) {
        const path = `docs/rules/${id.replace(/-/, '/')}.md`;
        assert.equal(rule.meta.docs.url, `${base}${path}`);
        assert.ok(existsSync(new URL(path, root)), path);
        assert.ok(readme.includes(`](${path})`), `README lists ${id}`);
        assert.ok(rule.meta.docs.description);
        assert.equal(typeof rule.create, 'function');
    }
    // Public IDs deliberately differ from some implementation filenames.
    const { default: original } = await import('../src/rules/amp/argument-types.js');
    const { url: _url, ...documentation } = sfmc.rules['amp-arg-types'].meta.docs;
    assert.deepEqual(documentation, original.meta.docs);
    assert.deepEqual(sfmc.rules['amp-arg-types'].meta, {
        ...original.meta,
        docs: { ...documentation, url: _url },
    });
    assert.equal(sfmc.rules['amp-arg-types'].create, original.create);
    assert.equal(original.meta.docs.url, undefined);
});

const cases = [
    [
        'standalone AMPscript',
        sfmc.configs.recommended,
        'sample.amp',
        '%%= FooBar() =%%',
        'sfmc/amp-no-unknown-function',
    ],
    [
        'standalone SSJS',
        sfmc.configs.recommended,
        'sample.ssjs',
        'var value; switch (1) { default: break; }',
        'sfmc/ssjs-no-switch-default',
    ],
    [
        'embedded AMPscript',
        sfmc.configs.embedded,
        'sample.html',
        '<p>%%= FooBar() =%%</p>',
        'sfmc/amp-no-unknown-function',
    ],
    [
        'embedded SSJS',
        sfmc.configs.embedded,
        'sample.html',
        '<script runat="server">var value; switch (1) { default: break; }</script>',
        'sfmc/ssjs-no-switch-default',
    ],
    [
        'standalone Handlebars Next',
        sfmc.configs['recommended-next'],
        'sample.hbs',
        '{{unknownHelper value}}',
        'sfmc/hbs-no-unknown-helper',
    ],
    [
        'embedded Handlebars Next',
        sfmc.configs['embedded-next'],
        'sample.html',
        '<p>{{unknownHelper value}}</p>',
        'sfmc/hbs-no-unknown-helper',
    ],
];

for (const [name, config, filePath, code, id] of cases) {
    test(`ESLint exposes versioned rule metadata for ${name}`, async () => {
        const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
        const results = await eslint.lintText(code, { filePath });
        assert.ok(
            results[0].messages.some((message) => message.ruleId === id),
            JSON.stringify(results),
        );
        const rules = eslint.getRulesMetaForResults(results);
        assert.equal(rules[id].docs.url, sfmc.rules[id.slice('sfmc/'.length)].meta.docs.url);
    });
}

test('boolean-like classifier requires the complete eight-value enum', () => {
    assert.equal(
        isBooleanLikeParameter({ enum: [true, false, 1, 0, 'true', 'false', '1', '0'] }),
        true,
    );
    assert.equal(isBooleanLikeParameter({ enum: [true, false, 1, 0] }), false);
    assert.equal(
        isBooleanLikeParameter({ enum: [true, false, 1, 0, 'true', 'false', '1'] }),
        false,
    );
    assert.equal(
        isBooleanLikeParameter({ enum: [true, false, 1, 0, 'true', 'false', '1', '0', 'yes'] }),
        false,
    );
});

test('all 24 catalogued boolean-like parameters use the complete enum', () => {
    const parameters = FUNCTIONS.flatMap((entry) => entry.params ?? []).filter(
        (parameter) =>
            Array.isArray(parameter.enum) &&
            parameter.enum.includes(true) &&
            parameter.enum.includes(false),
    );
    assert.equal(parameters.length, 24);
    assert.ok(parameters.every((parameter) => isBooleanLikeParameter(parameter)));
});

test('boolean literal recommendation is warn in recommended and strict configs', () => {
    const recommendedAmp = sfmc.configs.recommended.find(
        (config) => config.name === 'sfmc/recommended-ampscript',
    );
    const strictAmp = sfmc.configs.strict.find((config) => config.name === 'sfmc/strict-ampscript');
    assert.equal(recommendedAmp.rules['sfmc/amp-prefer-boolean-literal'], 'warn');
    assert.equal(strictAmp.rules['sfmc/amp-prefer-boolean-literal'], 'warn');
    assert.equal(sfmc.configs.ampscript.rules['sfmc/amp-prefer-boolean-literal'], 'warn');
});

test('custom namespaces keep owner URLs and leave core and third-party metadata untouched', async () => {
    const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: {
            plugins: { custom: sfmc },
            rules: { 'custom/ssjs-no-switch-default': 'warn', 'no-unused-vars': 'error' },
        },
    });
    const results = await eslint.lintText('var value; switch (1) { default: break; }', {
        filePath: 'sample.js',
    });
    const rules = eslint.getRulesMetaForResults(results);
    assert.equal(
        rules['custom/ssjs-no-switch-default'].docs.url,
        sfmc.rules['ssjs-no-switch-default'].meta.docs.url,
    );
    assert.match(rules['no-unused-vars'].docs.url, /^https:\/\/eslint\.org\//);
    assert.ok(results[0].messages.some((message) => message.severity === 1));
    assert.ok(results[0].messages.some((message) => message.severity === 2));
    for (const rule of Object.values(mso.rules)) {
        assert.ok(!rule.meta.docs?.url?.startsWith(base));
    }
});

test('package identity is independent of the caller working directory', () => {
    const entry = new URL('../src/index.js', import.meta.url).href;
    const output = execFileSync(
        process.execPath,
        [
            '--input-type=module',
            '-e',
            `import plugin from ${JSON.stringify(entry)}; console.log(JSON.stringify({ version: plugin.meta.version, url: plugin.rules['amp-arg-types'].meta.docs.url }));`,
        ],
        { cwd: tmpdir(), encoding: 'utf8' },
    );
    assert.deepEqual(JSON.parse(output), {
        version: metadata.version,
        url: `${base}docs/rules/amp/arg-types.md`,
    });
});

test('parser failures remain explicitly outside rule metadata', async () => {
    const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: sfmc.configs.recommended,
    });
    const results = await eslint.lintText('var = ;', { filePath: 'sample.ssjs' });
    assert.equal(results[0].messages[0].ruleId, null);
    assert.equal(results[0].messages[0].fatal, true);
    assert.deepEqual(eslint.getRulesMetaForResults(results), {});
});
