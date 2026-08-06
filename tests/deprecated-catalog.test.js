/**
 * Data-driven invariant for ssjs-no-deprecated-function:
 * every deprecated callable global / Platform.Function in ssjs-data must be
 * flagged by the rule (mirrors LSP ssjs/deprecated coverage).
 */
import { RuleTester } from 'eslint';
import assert from 'node:assert/strict';
import { SSJS_GLOBALS, PLATFORM_FUNCTIONS, maxCoreVersionLookup } from 'ssjs-data';
import ssjsNoDeprecatedFunction from '../src/rules/ssjs/no-deprecated-function.js';

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 5,
        sourceType: 'script',
    },
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
