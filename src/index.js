/**
 * eslint-plugin-sfmc
 *
 * Unified ESLint plugin for Salesforce Marketing Cloud.
 * Provides linting rules for both AMPscript and Server-Side JavaScript (SSJS).
 *
 * Designed to complement:
 *   - prettier-plugin-sfmc (formatting)
 *   - vscode-sfmc-language (IntelliSense, diagnostics)
 */

import { SSJS_GLOBALS_MAP } from 'ssjs-data';
import * as ampscriptParser from './ampscript-parser.js';

// ── AMPscript rules ───────────────────────────────────────────────────────────

import ampNoUnknownFunction from './rules/amp/no-unknown-function.js';
import ampNoVariableRedeclaration from './rules/amp/no-var-redeclaration.js';
import ampSetRequiresTarget from './rules/amp/set-requires-target.js';
import ampNoEmptyBlock from './rules/amp/no-empty-block.js';
import ampNoSmartQuotes from './rules/amp/no-smart-quotes.js';
import ampPreferAttributeValue from './rules/amp/prefer-attribute-value.js';
import ampNoLoopCounterAssign from './rules/amp/no-loop-counter-assign.js';
import ampNoInlineStatement from './rules/amp/no-inline-statement.js';
import ampRequireVariableDeclaration from './rules/amp/require-variable-declaration.js';
import ampFunctionArity from './rules/amp/function-arity.js';
import ampNoEmailExcludedFunction from './rules/amp/no-email-excluded-function.js';
import ampNoDeprecatedFunction from './rules/amp/no-deprecated-function.js';
import ampNamingConvention from './rules/amp/naming-convention.js';
import ampNoEmptyThen from './rules/amp/no-empty-then.js';
import ampRequireRowcountCheck from './rules/amp/require-rowcount-check.js';
import ampNoHtmlComment from './rules/amp/no-html-comment.js';
import ampNoJsLineComment from './rules/amp/no-js-line-comment.js';
import ampNoNestedScriptTag from './rules/amp/no-nested-script-tag.js';
import ampNoNestedAmpscriptDelimiter from './rules/amp/no-nested-ampscript-delimiter.js';

// ── SSJS rules ────────────────────────────────────────────────────────────────

import ssjsRequirePlatformLoad from './rules/ssjs/require-platform-load.js';
import ssjsNoUnsupportedSyntax from './rules/ssjs/no-unsupported-syntax.js';
import ssjsNoUnknownPlatformFunction from './rules/ssjs/no-unknown-platform-function.js';
import ssjsNoUnknownCoreMethod from './rules/ssjs/no-unknown-core-method.js';
import ssjsPlatformFunctionArity from './rules/ssjs/platform-function-arity.js';
import ssjsNoUnknownHttpMethod from './rules/ssjs/no-unknown-http-method.js';
import ssjsNoUnknownWsproxyMethod from './rules/ssjs/no-unknown-wsproxy-method.js';
import ssjsNoUnknownPlatformVariable from './rules/ssjs/no-unknown-platform-variable.js';
import ssjsNoUnknownPlatformResponse from './rules/ssjs/no-unknown-platform-response.js';
import ssjsNoUnknownPlatformRequest from './rules/ssjs/no-unknown-platform-request.js';
import ssjsNoUnknownPlatformClientBrowser from './rules/ssjs/no-unknown-platform-client-browser.js';
import ssjsCacheLoopLength from './rules/ssjs/cache-loop-length.js';
import ssjsRequireHasownproperty from './rules/ssjs/require-hasownproperty.js';
import ssjsRequirePlatformLoadOrder from './rules/ssjs/require-platform-load-order.js';
import ssjsNoHardcodedCredentials from './rules/ssjs/no-hardcoded-credentials.js';
import ssjsPreferPlatformLoadVersion from './rules/ssjs/prefer-platform-load-version.js';
import ssjsNoUnavailableMethod from './rules/ssjs/no-unavailable-method.js';
import ssjsPreferParsejsonSafeArg from './rules/ssjs/prefer-parsejson-safe-arg.js';
import ssjsNoSwitchDefault from './rules/ssjs/no-switch-default.js';
import ssjsNoTreatAsContentInjection from './rules/ssjs/no-treatascontent-injection.js';

// ── Processors ────────────────────────────────────────────────────────────────

import ampscriptProcessor from './ampscript-processor.js';
import ssjsProcessor from './ssjs-processor.js';
import combinedProcessor from './processor.js';

// ── Plugin definition ─────────────────────────────────────────────────────────

const plugin = {
    meta: {
        name: 'eslint-plugin-sfmc',
        version: '0.1.0',
    },

    rules: {
        // AMPscript rules (amp- prefix)
        'amp-no-unknown-function': ampNoUnknownFunction,
        'amp-no-var-redeclaration': ampNoVariableRedeclaration,
        'amp-set-requires-target': ampSetRequiresTarget,
        'amp-no-empty-block': ampNoEmptyBlock,
        'amp-no-smart-quotes': ampNoSmartQuotes,
        'amp-prefer-attribute-value': ampPreferAttributeValue,
        'amp-no-loop-counter-assign': ampNoLoopCounterAssign,
        'amp-no-inline-statement': ampNoInlineStatement,
        'amp-require-variable-declaration': ampRequireVariableDeclaration,
        'amp-function-arity': ampFunctionArity,
        'amp-no-email-excluded-function': ampNoEmailExcludedFunction,
        'amp-no-deprecated-function': ampNoDeprecatedFunction,
        'amp-naming-convention': ampNamingConvention,
        'amp-no-empty-then': ampNoEmptyThen,
        'amp-require-rowcount-check': ampRequireRowcountCheck,
        'amp-no-html-comment': ampNoHtmlComment,
        'amp-no-js-line-comment': ampNoJsLineComment,
        'amp-no-nested-script-tag': ampNoNestedScriptTag,
        'amp-no-nested-ampscript-delimiter': ampNoNestedAmpscriptDelimiter,

        // SSJS rules (ssjs- prefix)
        'ssjs-require-platform-load': ssjsRequirePlatformLoad,
        'ssjs-no-unsupported-syntax': ssjsNoUnsupportedSyntax,
        'ssjs-no-unknown-platform-function': ssjsNoUnknownPlatformFunction,
        'ssjs-no-unknown-core-method': ssjsNoUnknownCoreMethod,
        'ssjs-platform-function-arity': ssjsPlatformFunctionArity,
        'ssjs-no-unknown-http-method': ssjsNoUnknownHttpMethod,
        'ssjs-no-unknown-wsproxy-method': ssjsNoUnknownWsproxyMethod,
        'ssjs-no-unknown-platform-variable': ssjsNoUnknownPlatformVariable,
        'ssjs-no-unknown-platform-response': ssjsNoUnknownPlatformResponse,
        'ssjs-no-unknown-platform-request': ssjsNoUnknownPlatformRequest,
        'ssjs-no-unknown-platform-client-browser': ssjsNoUnknownPlatformClientBrowser,
        'ssjs-cache-loop-length': ssjsCacheLoopLength,
        'ssjs-require-hasownproperty': ssjsRequireHasownproperty,
        'ssjs-require-platform-load-order': ssjsRequirePlatformLoadOrder,
        'ssjs-no-hardcoded-credentials': ssjsNoHardcodedCredentials,
        'ssjs-prefer-platform-load-version': ssjsPreferPlatformLoadVersion,
        'ssjs-no-unavailable-method': ssjsNoUnavailableMethod,
        'ssjs-prefer-parsejson-safe-arg': ssjsPreferParsejsonSafeArg,
        'ssjs-no-switch-default': ssjsNoSwitchDefault,
        'ssjs-no-treatascontent-injection': ssjsNoTreatAsContentInjection,
    },

    processors: {
        ampscript: ampscriptProcessor,
        ssjs: ssjsProcessor,
        sfmc: combinedProcessor,
    },

    configs: {},
};

// ── AMPscript rule sets ───────────────────────────────────────────────────────

const ampRecommendedRules = {
    'sfmc/amp-no-unknown-function': 'error',
    'sfmc/amp-no-var-redeclaration': 'warn',
    'sfmc/amp-set-requires-target': 'error',
    'sfmc/amp-no-empty-block': 'warn',
    'sfmc/amp-no-smart-quotes': 'error',
    'sfmc/amp-no-loop-counter-assign': 'warn',
    'sfmc/amp-no-inline-statement': 'warn',
    'sfmc/amp-function-arity': 'error',
    'sfmc/amp-no-deprecated-function': 'warn',
    'sfmc/amp-naming-convention': 'warn',
    'sfmc/amp-no-empty-then': 'warn',
    'sfmc/amp-require-rowcount-check': 'warn',
    'sfmc/amp-no-html-comment': 'warn',
    'sfmc/amp-no-js-line-comment': 'warn',
    'sfmc/amp-no-nested-script-tag': 'error',
    'sfmc/amp-no-nested-ampscript-delimiter': 'error',
};

const ampStrictRules = {
    'sfmc/amp-no-unknown-function': 'error',
    'sfmc/amp-no-var-redeclaration': 'error',
    'sfmc/amp-set-requires-target': 'error',
    'sfmc/amp-no-empty-block': 'error',
    'sfmc/amp-no-smart-quotes': 'error',
    'sfmc/amp-prefer-attribute-value': 'warn',
    'sfmc/amp-no-loop-counter-assign': 'error',
    'sfmc/amp-no-inline-statement': 'error',
    'sfmc/amp-require-variable-declaration': 'warn',
    'sfmc/amp-function-arity': 'error',
    'sfmc/amp-no-email-excluded-function': ['error', { context: 'email' }],
    'sfmc/amp-no-deprecated-function': 'error',
    'sfmc/amp-naming-convention': ['error', { format: 'camelCase' }],
    'sfmc/amp-no-empty-then': 'error',
    'sfmc/amp-require-rowcount-check': 'error',
    'sfmc/amp-no-html-comment': 'error',
    'sfmc/amp-no-js-line-comment': 'error',
    'sfmc/amp-no-nested-script-tag': 'error',
    'sfmc/amp-no-nested-ampscript-delimiter': 'error',
};

// ── SSJS rule sets ────────────────────────────────────────────────────────────

const ssjsRecommendedRules = {
    'sfmc/ssjs-require-platform-load': 'error',
    'sfmc/ssjs-no-unsupported-syntax': 'error',
    'sfmc/ssjs-no-unknown-platform-function': 'error',
    'sfmc/ssjs-no-unknown-core-method': 'warn',
    'sfmc/ssjs-platform-function-arity': 'error',
    'sfmc/ssjs-no-unknown-http-method': 'error',
    'sfmc/ssjs-no-unknown-wsproxy-method': 'warn',
    'sfmc/ssjs-no-unknown-platform-variable': 'error',
    'sfmc/ssjs-no-unknown-platform-response': 'error',
    'sfmc/ssjs-no-unknown-platform-request': 'error',
    'sfmc/ssjs-no-unknown-platform-client-browser': 'error',
    'sfmc/ssjs-cache-loop-length': 'warn',
    'sfmc/ssjs-require-hasownproperty': 'warn',
    'sfmc/ssjs-require-platform-load-order': 'error',
    'sfmc/ssjs-no-hardcoded-credentials': 'error',
    'sfmc/ssjs-prefer-platform-load-version': 'warn',
    'sfmc/ssjs-no-unavailable-method': 'warn',
    'sfmc/ssjs-prefer-parsejson-safe-arg': 'warn',
    'sfmc/ssjs-no-switch-default': 'warn',
    'sfmc/ssjs-no-treatascontent-injection': 'warn',
    'no-cond-assign': 'error',
};

const ssjsStrictRules = {
    'sfmc/ssjs-require-platform-load': 'error',
    'sfmc/ssjs-no-unsupported-syntax': 'error',
    'sfmc/ssjs-no-unknown-platform-function': 'error',
    'sfmc/ssjs-no-unknown-core-method': 'error',
    'sfmc/ssjs-platform-function-arity': 'error',
    'sfmc/ssjs-no-unknown-http-method': 'error',
    'sfmc/ssjs-no-unknown-wsproxy-method': 'error',
    'sfmc/ssjs-no-unknown-platform-variable': 'error',
    'sfmc/ssjs-no-unknown-platform-response': 'error',
    'sfmc/ssjs-no-unknown-platform-request': 'error',
    'sfmc/ssjs-no-unknown-platform-client-browser': 'error',
    'sfmc/ssjs-cache-loop-length': 'error',
    'sfmc/ssjs-require-hasownproperty': 'error',
    'sfmc/ssjs-require-platform-load-order': 'error',
    'sfmc/ssjs-no-hardcoded-credentials': 'error',
    'sfmc/ssjs-prefer-platform-load-version': 'error',
    'sfmc/ssjs-no-unavailable-method': 'warn',
    'sfmc/ssjs-prefer-parsejson-safe-arg': 'error',
    'sfmc/ssjs-no-switch-default': 'error',
    'sfmc/ssjs-no-treatascontent-injection': 'error',
    'no-cond-assign': 'error',
};

// ── Configs (defined after plugin so they can reference it) ───────────────────

Object.assign(plugin.configs, {
    /**
     * AMPscript-only config for standalone .ampscript/.amp files.
     */
    ampscript: {
        name: 'sfmc/ampscript',
        plugins: { sfmc: plugin },
        languageOptions: { parser: ampscriptParser },
        files: ['**/*.ampscript', '**/*.amp'],
        rules: { ...ampRecommendedRules },
    },

    /**
     * SSJS-only config for standalone .ssjs files.
     */
    ssjs: {
        name: 'sfmc/ssjs',
        plugins: { sfmc: plugin },
        files: ['**/*.ssjs'],
        languageOptions: {
            ecmaVersion: 5,
            sourceType: 'script',
            globals: SSJS_GLOBALS_MAP,
        },
        rules: { ...ssjsRecommendedRules },
    },

    /**
     * Recommended config: both AMPscript and SSJS for standalone files.
     * Returns an array of config objects.
     */
    recommended: [
        {
            name: 'sfmc/recommended-ampscript',
            plugins: { sfmc: plugin },
            languageOptions: { parser: ampscriptParser },
            files: ['**/*.ampscript', '**/*.amp'],
            rules: { ...ampRecommendedRules },
        },
        {
            name: 'sfmc/recommended-ssjs',
            plugins: { sfmc: plugin },
            files: ['**/*.ssjs'],
            languageOptions: {
                ecmaVersion: 5,
                sourceType: 'script',
                globals: SSJS_GLOBALS_MAP,
            },
            rules: { ...ssjsRecommendedRules },
        },
    ],

    /**
     * Config for AMPscript and SSJS embedded in HTML files.
     * Uses the combined processor to extract both language regions.
     */
    embedded: [
        {
            name: 'sfmc/embedded-processor',
            plugins: { sfmc: plugin },
            files: ['**/*.html'],
            processor: 'sfmc/sfmc',
        },
        {
            name: 'sfmc/embedded-ampscript-rules',
            plugins: { sfmc: plugin },
            languageOptions: { parser: ampscriptParser },
            files: ['**/*.html/*.amp'],
            rules: { ...ampRecommendedRules },
        },
        {
            name: 'sfmc/embedded-ssjs-rules',
            plugins: { sfmc: plugin },
            files: ['**/*.html/*.js'],
            languageOptions: {
                ecmaVersion: 5,
                sourceType: 'script',
                globals: SSJS_GLOBALS_MAP,
            },
            rules: { ...ssjsRecommendedRules },
        },
    ],

    /**
     * Strict config: all rules at error severity for standalone + embedded.
     */
    strict: [
        {
            name: 'sfmc/strict-ampscript',
            plugins: { sfmc: plugin },
            languageOptions: { parser: ampscriptParser },
            files: ['**/*.ampscript', '**/*.amp'],
            rules: { ...ampStrictRules },
        },
        {
            name: 'sfmc/strict-ssjs',
            plugins: { sfmc: plugin },
            files: ['**/*.ssjs'],
            languageOptions: {
                ecmaVersion: 5,
                sourceType: 'script',
                globals: SSJS_GLOBALS_MAP,
            },
            rules: { ...ssjsStrictRules },
        },
        {
            name: 'sfmc/strict-embedded-processor',
            plugins: { sfmc: plugin },
            files: ['**/*.html'],
            processor: 'sfmc/sfmc',
        },
        {
            name: 'sfmc/strict-embedded-ampscript-rules',
            plugins: { sfmc: plugin },
            languageOptions: { parser: ampscriptParser },
            files: ['**/*.html/*.amp'],
            rules: { ...ampStrictRules },
        },
        {
            name: 'sfmc/strict-embedded-ssjs-rules',
            plugins: { sfmc: plugin },
            files: ['**/*.html/*.js'],
            languageOptions: {
                ecmaVersion: 5,
                sourceType: 'script',
                globals: SSJS_GLOBALS_MAP,
            },
            rules: { ...ssjsStrictRules },
        },
    ],
});

export default plugin;
