import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ESLint } from 'eslint';
import unicorn from 'eslint-plugin-unicorn';
import sfmcPlugin from '../src/index.js';

// These execute the upstream linter, not the SFMC runtime. Runtime policy evidence
// is maintained separately in the compatibility documentation.
const witnesses = [
    {
        rule: 'no-for-loop',
        code: 'function visit(values) { for (var i = 0; i < values.length; i++) { consume(values[i]); } }',
        output: 'function visit(values) { for (const value of values) { consume(value); } }',
        kind: 'fix',
        // The v74 visitor needs block scopes, absent with strict ES5 parsing.
        ecmaVersion: 2015,
    },
    {
        rule: 'prefer-default-parameters',
        code: 'function choose(value) { value = value || 1; return value; }',
        output: 'function choose(value = 1) { return value; }',
        kind: 'suggestion',
    },
    {
        rule: 'prefer-includes-over-repeated-comparisons',
        code: 'function matches(value) { return value === 1 || value === 2 || value === 3; }',
        kind: 'diagnostic',
    },
    {
        rule: 'prefer-object-define-properties',
        code: 'Object.defineProperty(target, "first", {value: 1}); Object.defineProperty(target, "second", {value: 2});',
        output: 'Object.defineProperties(target, {\n\tfirst: {value: 1},\n\tsecond: {value: 2},\n});',
        kind: 'fix',
    },
    {
        rule: 'no-new-array',
        // Unknown parameter prevents static evaluation: v74 string-method type
        // inference, not a constant numeric argument, makes this fix reachable.
        code: 'function allocate(value) { return new Array("abc".indexOf(value)); }',
        output: 'function allocate(value) { return Array.from({length: "abc".indexOf(value)}); }',
        kind: 'fix',
    },
    {
        rule: 'no-unnecessary-array-splice-count',
        code: 'function remove(values) { return values.splice(1, values.length); }',
        output: 'function remove(values) { return values.splice(1); }',
        kind: 'fix',
    },
    // CloudPage probe evidence establishes target failures; these cases only pin
    // installed v74 transformations, not native SSJS execution or equivalence.
    {
        rule: 'prefer-string-slice',
        code: '"Hello".substring();',
        output: '"Hello".slice();',
        kind: 'fix',
    },
    {
        rule: 'prefer-object-from-entries',
        // This upstream reduce branch requires modern syntax. It is not an
        // ES5-reachable source or a claim that native reduce/Object.assign work.
        code: 'pairs.reduce((object, pair) => Object.assign(object, {[pair[0]]: pair[1]}), {});',
        output: 'Object.fromEntries(pairs.map(( pair) => [pair[0], pair[1]]));',
        kind: 'fix',
        ecmaVersion: 2015,
    },
    {
        rule: 'prefer-object-from-entries',
        code: 'makeObject(pairs);',
        output: 'Object.fromEntries(pairs);',
        kind: 'fix',
        options: { functions: ['makeObject'] },
    },
    {
        rule: 'no-array-reverse',
        code: 'var result = [1,2,3].reverse();',
        output: 'var result = [1,2,3].toReversed();',
        kind: 'suggestion',
    },
    {
        rule: 'no-array-sort',
        // Pin the absent-comparator branch, not native default-sort success.
        code: 'var result = [10,2,1].sort();',
        output: 'var result = [10,2,1].toSorted();',
        kind: 'suggestion',
    },
    {
        rule: 'no-array-sort',
        code: 'var result = [10,2,1].sort(function (a, b) { return a - b; });',
        output: 'var result = [10,2,1].toSorted(function (a, b) { return a - b; });',
        kind: 'suggestion',
    },
    {
        rule: 'no-array-splice',
        code: 'function update() { var values = [1,2,3]; values.splice(1,1,9); }',
        output: 'function update() { var values = [1,2,3]; values = values.toSpliced(1,1,9); }',
        kind: 'suggestion',
    },
    {
        rule: 'prefer-string-replace-all',
        code: '"aba".replace(/a/g, "x");',
        output: '"aba".replaceAll(\'a\', "x");',
        kind: 'fix',
    },
    {
        rule: 'prefer-string-replace-all',
        code: '"aba".split("a").join("x");',
        output: "\"aba\".replaceAll('a', 'x');",
        kind: 'fix',
    },
];

/**
 * Build isolated rule execution with the real HTML processor and public overrides.
 *
 * @param {object} witness - Rule witness and parser setting.
 * @param {boolean} protectedMode - Whether both public protections are appended.
 * @param {boolean} [shouldFix] - Whether ESLint should apply automatic fixes.
 * @returns {ESLint} Configured linter.
 */
function createLinter(witness, protectedMode, shouldFix = false) {
    return new ESLint({
        overrideConfigFile: true,
        fix: shouldFix,
        overrideConfig: [
            { plugins: { unicorn, sfmc: sfmcPlugin } },
            { files: ['**/*.html'], processor: 'sfmc/sfmc' },
            {
                files: ['**/*.{js,mjs,ssjs}'],
                languageOptions: {
                    ecmaVersion: witness.ecmaVersion ?? 5,
                    sourceType: 'script',
                },
                rules: {
                    [`unicorn/${witness.rule}`]: witness.options
                        ? ['error', witness.options]
                        : 'error',
                },
            },
            ...(protectedMode
                ? [sfmcPlugin.configs['unicorn-ssjs'], sfmcPlugin.configs['unicorn-ssjs-embedded']]
                : []),
        ],
    });
}

/**
 * Assert the exact upstream fix, suggestion, or diagnostic-only contract.
 *
 * @param {object} witness - Expected report and replacement.
 * @param {object} result - ESLint result before applying fixes.
 * @param {boolean} embedded - Whether processor mapping strips edits.
 * @returns {void}
 */
function assertUpstreamReport(witness, result, embedded) {
    assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
    assert.equal(result.messages.length, 1, JSON.stringify(result.messages));
    const [diagnostic] = result.messages;
    assert.equal(diagnostic.ruleId, `unicorn/${witness.rule}`);
    if (embedded) {
        // supportsAutofix:false removes fixes AND suggestions, not diagnostics.
        assert.equal(diagnostic.fix, undefined);
        assert.equal(diagnostic.suggestions, undefined);
        return;
    }
    if (witness.kind === 'diagnostic') {
        assert.match(diagnostic.message, /\.includes\(\)/);
        assert.equal(diagnostic.fix, undefined);
        assert.equal(diagnostic.suggestions, undefined);
        return;
    }
    let edit;
    if (witness.kind === 'suggestion') {
        assert.equal(diagnostic.fix, undefined);
        assert.equal(diagnostic.suggestions.length, 1);
        edit = diagnostic.suggestions[0].fix;
    } else {
        assert.ok(diagnostic.fix);
        assert.equal(diagnostic.suggestions, undefined);
        edit = diagnostic.fix;
    }
    assert.equal(
        witness.code.slice(0, edit.range[0]) + edit.text + witness.code.slice(edit.range[1]),
        witness.output,
    );
}

describe('Unicorn 74 syntax/API and measured-target protection witnesses', () => {
    it('executes the intended upstream major version', () => {
        assert.match(unicorn.meta.version, /^74\./);
    });

    for (const witness of witnesses) {
        for (const embedded of [false, true]) {
            const filePath = embedded ? 'protection.html' : 'protection.ssjs';
            const source = embedded
                ? '<script runat="server">' + witness.code + '</script>'
                : witness.code;

            it(`${witness.rule}: upstream report in ${filePath}`, async () => {
                const [result] = await createLinter(witness, false).lintText(source, { filePath });
                assertUpstreamReport(witness, result, embedded);
            });

            it(`${witness.rule}: scoped protection in ${filePath}`, async () => {
                for (const fix of [false, true]) {
                    const [result] = await createLinter(witness, true, fix).lintText(source, {
                        filePath,
                    });
                    assert.equal(result.fatalErrorCount, 0);
                    assert.deepEqual(result.messages, []);
                    assert.equal(result.output ?? source, source);
                }
            });
        }

        for (const filePath of ['browser.js', 'hook.mjs']) {
            it(`${witness.rule}: protections do not leak into ${filePath}`, async () => {
                const [result] = await createLinter(witness, true).lintText(witness.code, {
                    filePath,
                });
                assertUpstreamReport(witness, result, false);
            });
        }
    }

    // Reuse the existing splice-defect suite rather than restating native bugs.
    // These only establish v74's ownership/used-return suggestion guards.
    for (const code of [
        'function update() { var values = [1,2,3]; var alias = values; values.splice(1,1,9); }',
        'function update() { var values = [1,2,3]; return values.splice(1,1,9); }',
    ]) {
        for (const filePath of ['guard.ssjs', 'guard.html', 'ordinary.js']) {
            it(`no-array-splice: eligibility guard in ${filePath}: ${code}`, async () => {
                const source = filePath.endsWith('.html')
                    ? '<script runat="server">' + code + '</script>'
                    : code;
                const [result] = await createLinter({ rule: 'no-array-splice' }, false).lintText(
                    source,
                    { filePath },
                );
                assert.equal(result.fatalErrorCount, 0);
                assert.deepEqual(result.messages, []);
            });
        }
    }

    it('no-for-loop remains conditionally inert with strict ES5 block scoping', async () => {
        const witness = { ...witnesses[0], ecmaVersion: 5 };
        for (const filePath of ['strict.ssjs', 'strict.html']) {
            const source = filePath.endsWith('.html')
                ? '<script runat="server">' + witness.code + '</script>'
                : witness.code;
            const [result] = await createLinter(witness, false).lintText(source, { filePath });
            assert.equal(result.fatalErrorCount, 0);
            assert.deepEqual(result.messages, []);
        }
    });
});
