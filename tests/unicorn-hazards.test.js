import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ESLint } from 'eslint';
import unicorn from 'eslint-plugin-unicorn';
import sfmcPlugin from '../src/index.js';

// These establish upstream transformations, not new SFMC runtime evidence.
// Recorded engine deviations and their provenance belong in the compatibility doc.
const witnesses = [
    {
        rule: 'prefer-regexp-test',
        code: 'if ("x".match(/z/)) work();',
        output: 'if (/z/.test("x")) work();',
        id: 'string-match',
        kind: 'fix',
    },
    {
        rule: 'prefer-regexp-test',
        code: 'if ("x".search(/z/) !== -1) work();',
        output: 'if (/z/.test("x")) work();',
        id: 'string-search',
        kind: 'fix',
    },
    {
        rule: 'prefer-regexp-test',
        code: 'var r=/x/g; if (r.exec(s)) work();',
        output: 'var r=/x/g; if (r.test(s)) work();',
        id: 'regexp-exec',
        kind: 'suggestion',
    },
    {
        rule: 'no-unnecessary-splice',
        code: 'a.splice(0);',
        output: 'a.length = 0;',
        id: 'empty',
        kind: 'fix',
    },
    {
        rule: 'no-unnecessary-splice',
        code: 'var x=a.splice(0,1);',
        id: 'shift',
        kind: 'diagnostic',
    },
    {
        rule: 'no-unnecessary-splice',
        code: 'a.splice(0,0,x,y);',
        output: 'a.unshift(x, y);',
        id: 'unshift',
        kind: 'fix',
    },
    {
        rule: 'no-unnecessary-splice',
        code: 'var o={get a(){count++; return a;}}; o.a.splice(o.a.length,0,x);',
        output: 'var o={get a(){count++; return a;}}; o.a.push(x);',
        id: 'push',
        kind: 'fix',
    },
    {
        rule: 'no-redundant-comparison',
        code: 'if(x===y && x>Number.MIN_VALUE && y>0) work();',
        output: 'if(x===y && x>Number.MIN_VALUE) work();',
        id: 'no-redundant-comparison',
        kind: 'suggestion',
    },
    {
        rule: 'no-impossible-length-comparison',
        code: 'if(a.length < -Number.MIN_VALUE) work();',
        id: 'no-impossible-length-comparison',
        kind: 'diagnostic',
    },
    {
        rule: 'no-useless-coercion',
        code: 'Number(Number.MIN_VALUE > 0 ? 1 : "x");',
        output: '(Number.MIN_VALUE > 0 ? 1 : "x");',
        id: 'no-useless-coercion',
        kind: 'fix',
    },
];

/**
 * Create isolated upstream execution with optional public scoped protections.
 *
 * @param {string} rule - Upstream rule name.
 * @param {boolean} protectedMode - Append both public override objects.
 * @returns {ESLint} Configured linter.
 */
function createLinter(rule, protectedMode) {
    return new ESLint({
        overrideConfigFile: true,
        overrideConfig: [
            { plugins: { unicorn, sfmc: sfmcPlugin } },
            { files: ['**/*.html'], processor: 'sfmc/sfmc' },
            {
                files: ['**/*.{js,mjs,ssjs}'],
                languageOptions: { ecmaVersion: 5, sourceType: 'script' },
                rules: { [`unicorn/${rule}`]: 'error' },
            },
            ...(protectedMode
                ? [sfmcPlugin.configs['unicorn-ssjs'], sfmcPlugin.configs['unicorn-ssjs-embedded']]
                : []),
        ],
    });
}

/**
 * Check exact edit kinds; HTML deliberately strips both edit surfaces.
 *
 * @param {object} witness - Expected diagnostic and optional edited source.
 * @param {object} result - Upstream ESLint result.
 * @param {boolean} embedded - Whether HTML processor mapping was used.
 * @returns {void}
 */
function assertReport(witness, result, embedded) {
    assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
    assert.equal(result.messages.length, 1, JSON.stringify(result.messages));
    const [message] = result.messages;
    assert.equal(message.ruleId, `unicorn/${witness.rule}`);
    assert.equal(message.messageId, witness.id);
    if (embedded || witness.kind === 'diagnostic') {
        assert.equal(message.fix, undefined);
        assert.equal(message.suggestions, undefined);
        return;
    }
    let edit;
    if (witness.kind === 'suggestion') {
        assert.equal(message.fix, undefined);
        assert.equal(message.suggestions.length, 1);
        edit = message.suggestions[0].fix;
    } else {
        assert.ok(message.fix);
        assert.equal(message.suggestions, undefined);
        edit = message.fix;
    }
    assert.equal(
        witness.code.slice(0, edit.range[0]) + edit.text + witness.code.slice(edit.range[1]),
        witness.output,
    );
}

describe('Unicorn 74 focused semantic hazards', () => {
    it('loads upstream Unicorn 74', () => {
        assert.match(unicorn.meta.version, /^74\./);
    });

    for (const witness of witnesses) {
        for (const filePath of ['hazard.ssjs', 'hazard.html', 'ordinary.js', 'ordinary.mjs']) {
            const embedded = filePath.endsWith('.html');
            const source = embedded
                ? '<script runat="server">' + witness.code + '</script>'
                : witness.code;
            it(`${witness.rule}: upstream ${witness.id} in ${filePath}: ${witness.code}`, async () => {
                const [result] = await createLinter(witness.rule, false).lintText(source, {
                    filePath,
                });
                assertReport(witness, result, embedded);
            });
            it(`${witness.rule}: scoped policy in ${filePath}: ${witness.code}`, async () => {
                const [result] = await createLinter(witness.rule, true).lintText(source, {
                    filePath,
                });
                if (filePath.startsWith('ordinary.')) {
                    assertReport(witness, result, false);
                } else {
                    assert.equal(result.fatalErrorCount, 0);
                    assert.deepEqual(result.messages, []);
                    assert.equal(result.output, undefined);
                }
            });
        }
    }

    const negatives = [
        ['prefer-regexp-test', 'if("x".search(/z/) === 0) work();'],
        ['prefer-regexp-test', 'if("x".search(/z/)) work();'],
        ['prefer-regexp-test', 'var o={s:"x"}; if(o.s.match(/z/)) work();'],
        ['no-unnecessary-splice', 'var x=a.splice(0);'],
        ['no-unnecessary-splice', 'getArray().splice(getArray().length,0,x);'],
        ['no-redundant-comparison', 'if(x>Number.MIN_VALUE && x>0) work();'],
        ['no-impossible-length-comparison', 'if(a.length < Number.POSITIVE_INFINITY) work();'],
        ['no-impossible-length-comparison', 'var n=Number.MIN_VALUE; if(a.length < -n) work();'],
        ['no-useless-coercion', 'var m=Number.MIN_VALUE; Number(m > 0 ? 1 : "x");'],
    ];
    for (const [rule, code] of negatives) {
        it(`${rule}: upstream eligibility guard: ${code}`, async () => {
            const [result] = await createLinter(rule, false).lintText(code, {
                filePath: 'guard.ssjs',
            });
            assert.equal(result.fatalErrorCount, 0);
            assert.deepEqual(result.messages, []);
        });
    }
});

describe('Unicorn removal candidates remain active', () => {
    const active = [
        { rule: 'require-array-join-separator', code: 'a.join();', output: "a.join(',');" },
        {
            rule: 'prefer-global-number-constants',
            code: 'Number.POSITIVE_INFINITY;',
            output: 'Infinity;',
        },
        { rule: 'prefer-global-number-constants', code: 'Number.NaN;', output: 'NaN;' },
        {
            rule: 'prefer-global-number-constants',
            code: 'Number.NEGATIVE_INFINITY;',
            kind: 'diagnostic',
        },
    ];
    for (const witness of active) {
        for (const filePath of ['active.ssjs', 'active.html', 'ordinary.js']) {
            it(`${witness.rule}: retained report in ${filePath}: ${witness.code}`, async () => {
                const embedded = filePath.endsWith('.html');
                const source = embedded
                    ? '<script runat="server">' + witness.code + '</script>'
                    : witness.code;
                const [result] = await createLinter(witness.rule, true).lintText(source, {
                    filePath,
                });
                assertReport(
                    { ...witness, id: witness.rule, kind: witness.kind ?? 'fix' },
                    result,
                    embedded,
                );
            });
        }
    }
    for (const code of [
        'function f(Infinity){return Number.POSITIVE_INFINITY;}',
        'function f(NaN){return Number.NaN;}',
        'function f(Number){return Number.NaN;}',
    ]) {
        it(`numeric global shadowing suppresses upstream transformation: ${code}`, async () => {
            const [result] = await createLinter('prefer-global-number-constants', false).lintText(
                code,
                { filePath: 'shadow.ssjs' },
            );
            assert.equal(result.fatalErrorCount, 0);
            assert.deepEqual(result.messages, []);
        });
    }
});
