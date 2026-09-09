/**
 * Data-driven invariant for ssjs-no-deprecated-function:
 * every deprecated callable global / Platform.Function in ssjs-data must be
 * flagged by the rule (mirrors LSP ssjs/deprecated coverage).
 */
import { RuleTester } from 'eslint';
import assert from 'node:assert/strict';
import {
    SSJS_GLOBALS,
    PLATFORM_FUNCTIONS,
    maxCoreVersionLookup,
    KNOWN_UNSUPPORTED,
} from 'ssjs-data';
import ssjsNoUnavailableMethod from '../src/rules/ssjs/no-unavailable-method.js';
import ssjsNoDeprecatedFunction from '../src/rules/ssjs/no-deprecated-function.js';

// The 2.1.0 catalog adds nine confirmed absences, without verified polyfills.
const adoptedMembers = [
    'fromEntries',
    'toReversed',
    'toSorted',
    'toSpliced',
    'replaceAll',
    'matchAll',
    'structuredClone',
    'groupBy',
    'findLastIndex',
];
const adoptedEntries = adoptedMembers.map((member) => {
    const entry = KNOWN_UNSUPPORTED.find((candidate) => candidate.member === member);
    assert.ok(entry, `released catalog missing ${member}`);
    assert.equal(entry.hasPolyfill, false);
    assert.equal(entry.category, 'unavailable');
    assert.equal(entry.isConfirmed, true);
    return entry;
});

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 5,
        sourceType: 'script',
    },
});

const memberEntries = adoptedEntries.filter((entry) => entry.owner !== 'Global');
ruleTester.run('ssjs-no-unavailable-method/2.1.0-catalog', ssjsNoUnavailableMethod, {
    valid: [
        // Bare globals are intentionally outside this member-call rule.
        { code: `${adoptedEntries.find((entry) => entry.owner === 'Global').member}();` },
        ...memberEntries.map((entry) => ({
            code: `${entry.isStatic ? entry.owner : 'value'}.${entry.member}();`,
            options: [{ ignore: [entry.member] }],
        })),
        ...memberEntries
            .filter((entry) => !entry.isStatic)
            .map((entry) => ({
                code: `Platform.${entry.member}();`,
            })),
    ],
    invalid: memberEntries.map((entry) => ({
        code: `${entry.isStatic ? entry.owner : 'value'}.${entry.member}();`,
        errors: [{ messageId: 'unavailableNoPolyfill', suggestions: [] }],
        output: null,
    })),
});

const deprecatedCallableGlobals = SSJS_GLOBALS.filter((g) => g.deprecated && g.type !== 'object');
const deprecatedPlatformFns = PLATFORM_FUNCTIONS.filter((f) => f.deprecated);

assert.ok(
    deprecatedCallableGlobals.length > 0,
    'expected deprecated callable globals in ssjs-data',
);
assert.ok(deprecatedPlatformFns.length > 0, 'expected deprecated Platform.Functions in ssjs-data');

ruleTester.run('ssjs-no-deprecated-function/globals-catalog', ssjsNoDeprecatedFunction, {
    valid: [{ code: 'Platform.Function.GUID();' }],
    invalid: deprecatedCallableGlobals.map((g) => ({
        code: `var x = ${g.name}("x");`,
        errors: [{ messageId: 'deprecatedGlobal' }],
    })),
});

ruleTester.run('ssjs-no-deprecated-function/platform-catalog', ssjsNoDeprecatedFunction, {
    valid: [{ code: 'Platform.Function.GUID();' }],
    invalid: deprecatedPlatformFns.map((f) => ({
        code: `Platform.Function.${f.name}("x");`,
        errors: [{ messageId: 'deprecatedPlatformFunction' }],
    })),
});

// Every member bound to a maximum Core version must be flagged when the file loads
// a newer one. Only the qualified method entries are callable (e.g. "errorutil" itself
// is a namespace, not a call site), so bare namespace entries are skipped.
const maxCoreVersionMethods = maxCoreVersionLookup
    .values()
    .filter((entry) => entry.name.includes('.'))
    .toArray();

assert.ok(maxCoreVersionMethods.length > 0, 'expected maxCoreVersion-bound methods in ssjs-data');

ruleTester.run('ssjs-no-deprecated-function/max-core-version-catalog', ssjsNoDeprecatedFunction, {
    valid: [{ code: 'Platform.Function.GUID();' }],
    invalid: maxCoreVersionMethods.map((entry) => ({
        code: `Platform.Load("Core", "99");\n${entry.name}(result);`,
        errors: [{ messageId: 'unavailableInCoreVersion' }],
    })),
});
