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

import * as ampscriptParser from './ampscript-parser.js';
import * as handlebarsParser from './handlebars-parser.js';

// ── AMPscript rules ───────────────────────────────────────────────────────────

import ampNoUnknownFunction from './rules/amp/no-unknown-function.js';
import ampNoMcnUnsupported from './rules/amp/no-mcn-unsupported.js';
import ampNoVariableRedeclaration from './rules/amp/no-variable-redeclaration.js';
import ampSetRequiresTarget from './rules/amp/set-requires-target.js';
import ampNoEmptyBlock from './rules/amp/no-empty-block.js';
import ampNoSmartQuotes from './rules/amp/no-smart-quotes.js';
import ampPreferAttributeValue from './rules/amp/prefer-attribute-value.js';
import ampNoLoopCounterAssign from './rules/amp/no-loop-counter-assign.js';
import ampNoInlineStatement from './rules/amp/no-inline-statement.js';
import ampRequireVariableDeclaration from './rules/amp/require-variable-declaration.js';
import ampFunctionArity from './rules/amp/function-arity.js';
import ampArgumentTypes from './rules/amp/argument-types.js';
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
import ssjsNoUnknownFunction from './rules/ssjs/no-unknown-function.js';
import ssjsNoMcnUnsupported from './rules/ssjs/no-mcn-unsupported.js';
import ssjsNoDeprecatedFunction from './rules/ssjs/no-deprecated-function.js';
import ssjsNoPropertyCall from './rules/ssjs/no-property-call.js';
import ssjsPlatformFunctionArity from './rules/ssjs/platform-function-arity.js';
import ssjsCacheLoopLength from './rules/ssjs/cache-loop-length.js';
import ssjsRequireHasownproperty from './rules/ssjs/require-hasownproperty.js';
import ssjsRequirePlatformLoadOrder from './rules/ssjs/require-platform-load-order.js';
import ssjsNoHardcodedCredentials from './rules/ssjs/no-hardcoded-credentials.js';
import ssjsPreferPlatformLoadVersion from './rules/ssjs/prefer-platform-load-version.js';
import ssjsNoUnavailableMethod from './rules/ssjs/no-unavailable-method.js';
import ssjsPreferParsejsonSafeArgument from './rules/ssjs/prefer-parsejson-safe-argument.js';
import ssjsNoSwitchDefault from './rules/ssjs/no-switch-default.js';
import ssjsNoTreatAsContentInjection from './rules/ssjs/no-treatascontent-injection.js';
import ssjsArgumentTypes from './rules/ssjs/ssjs-argument-types.js';
import ssjsCoreMethodArity from './rules/ssjs/ssjs-core-method-arity.js';

// ── Handlebars (MCN) rules ──────────────────────────────────────────────────────

import hbsNoUnknownHelper from './rules/hbs/no-unknown-helper.js';
import hbsNoMcnUnsupported from './rules/hbs/no-mcn-unsupported.js';
import hbsNoUnknownBinding from './rules/hbs/no-unknown-binding.js';
import hbsHelperArity from './rules/hbs/helper-arity.js';
import hbsNoUnsupportedConstruct from './rules/hbs/no-unsupported-construct.js';

// ── Processors ────────────────────────────────────────────────────────────────

import ampscriptProcessor from './ampscript-processor.js';
import ssjsProcessor from './ssjs-processor.js';
import combinedProcessor from './processor.js';

// ── MSO / Outlook email plugin (auto-included in embedded/strict configs) ──────

import msoPlugin from 'eslint-plugin-mso-email';
import msoEslintParser from 'eslint-plugin-mso-email/mso-parser';
import htmlEslintParser from 'eslint-plugin-mso-email/html-parser';
import {
    MSO_VIRTUAL_BASENAME,
    DOCUMENT_VIRTUAL_BASENAME,
} from 'eslint-plugin-mso-email/comment-pattern';

// ── Data imports ──────────────────────────────────────────────────────────────
import { SSJS_GLOBALS_MAP } from 'ssjs-data';

// ── Plugin definition ─────────────────────────────────────────────────────────

const plugin = {
    meta: {
        name: 'eslint-plugin-sfmc',
        version: '0.1.0',
    },

    rules: {
        // AMPscript rules (amp- prefix)
        'amp-no-unknown-function': ampNoUnknownFunction,
        'amp-no-mcn-unsupported': ampNoMcnUnsupported,
        'amp-no-var-redeclaration': ampNoVariableRedeclaration,
        'amp-set-requires-target': ampSetRequiresTarget,
        'amp-no-empty-block': ampNoEmptyBlock,
        'amp-no-smart-quotes': ampNoSmartQuotes,
        'amp-prefer-attribute-value': ampPreferAttributeValue,
        'amp-no-loop-counter-assign': ampNoLoopCounterAssign,
        'amp-no-inline-statement': ampNoInlineStatement,
        'amp-require-variable-declaration': ampRequireVariableDeclaration,
        'amp-function-arity': ampFunctionArity,
        'amp-arg-types': ampArgumentTypes,
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
        'ssjs-no-unknown-function': ssjsNoUnknownFunction,
        'ssjs-no-mcn-unsupported': ssjsNoMcnUnsupported,
        'ssjs-no-deprecated-function': ssjsNoDeprecatedFunction,
        'ssjs-no-property-call': ssjsNoPropertyCall,
        'ssjs-platform-function-arity': ssjsPlatformFunctionArity,
        'ssjs-cache-loop-length': ssjsCacheLoopLength,
        'ssjs-require-hasownproperty': ssjsRequireHasownproperty,
        'ssjs-require-platform-load-order': ssjsRequirePlatformLoadOrder,
        'ssjs-no-hardcoded-credentials': ssjsNoHardcodedCredentials,
        'ssjs-prefer-platform-load-version': ssjsPreferPlatformLoadVersion,
        'ssjs-no-unavailable-method': ssjsNoUnavailableMethod,
        'ssjs-prefer-parsejson-safe-arg': ssjsPreferParsejsonSafeArgument,
        'ssjs-no-switch-default': ssjsNoSwitchDefault,
        'ssjs-no-treatascontent-injection': ssjsNoTreatAsContentInjection,
        'ssjs-arg-types': ssjsArgumentTypes,
        'ssjs-core-method-arity': ssjsCoreMethodArity,

        // Handlebars (MCN) rules (hbs- prefix)
        'hbs-no-unknown-helper': hbsNoUnknownHelper,
        'hbs-no-mcn-unsupported': hbsNoMcnUnsupported,
        'hbs-no-unknown-binding': hbsNoUnknownBinding,
        'hbs-helper-arity': hbsHelperArity,
        'hbs-no-unsupported-construct': hbsNoUnsupportedConstruct,
    },

    processors: {
        ampscript: ampscriptProcessor,
        ssjs: ssjsProcessor,
        sfmc: combinedProcessor,
    },
};

// ── MCN SSJS rule set (all SSJS rules off except ssjs-no-unknown-function) ────

/**
 * SSJS rules for MCN targets.
 * All quality rules are disabled — only the presence of SSJS is flagged, via the
 * dedicated `ssjs-no-mcn-unsupported` rule, because SSJS as a whole must be
 * deleted when targeting Marketing Cloud Next.
 */
const ssjsMcnRules = {
    'sfmc/ssjs-no-mcn-unsupported': 'error',
    'sfmc/ssjs-no-unknown-function': 'off',
    'sfmc/ssjs-require-platform-load': 'off',
    'sfmc/ssjs-no-unsupported-syntax': 'off',
    'sfmc/ssjs-no-deprecated-function': 'off',
    'sfmc/ssjs-no-property-call': 'off',
    'sfmc/ssjs-platform-function-arity': 'off',
    'sfmc/ssjs-cache-loop-length': 'off',
    'sfmc/ssjs-require-hasownproperty': 'off',
    'sfmc/ssjs-require-platform-load-order': 'off',
    'sfmc/ssjs-no-hardcoded-credentials': 'off',
    'sfmc/ssjs-prefer-platform-load-version': 'off',
    'sfmc/ssjs-no-unavailable-method': 'off',
    'sfmc/ssjs-prefer-parsejson-safe-arg': 'off',
    'sfmc/ssjs-no-switch-default': 'off',
    'sfmc/ssjs-no-treatascontent-injection': 'off',
    'sfmc/ssjs-arg-types': 'off',
    'sfmc/ssjs-core-method-arity': 'off',
    'no-cond-assign': 'off',
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
    'sfmc/amp-arg-types': 'error',
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
    'sfmc/amp-no-empty-block': 'warn',
    'sfmc/amp-no-smart-quotes': 'error',
    'sfmc/amp-prefer-attribute-value': 'warn',
    'sfmc/amp-no-loop-counter-assign': 'error',
    'sfmc/amp-no-inline-statement': 'error',
    'sfmc/amp-require-variable-declaration': 'warn',
    'sfmc/amp-function-arity': 'error',
    'sfmc/amp-arg-types': 'error',
    'sfmc/amp-no-email-excluded-function': 'off',
    'sfmc/amp-no-deprecated-function': 'warn',
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
    'sfmc/ssjs-no-unknown-function': 'error',
    'sfmc/ssjs-no-deprecated-function': 'error',
    'sfmc/ssjs-no-property-call': 'error',
    'sfmc/ssjs-platform-function-arity': 'error',
    'sfmc/ssjs-cache-loop-length': 'warn',
    'sfmc/ssjs-require-hasownproperty': 'warn',
    'sfmc/ssjs-require-platform-load-order': 'error',
    'sfmc/ssjs-no-hardcoded-credentials': 'error',
    'sfmc/ssjs-prefer-platform-load-version': 'warn',
    'sfmc/ssjs-no-unavailable-method': 'warn',
    'sfmc/ssjs-prefer-parsejson-safe-arg': 'warn',
    'sfmc/ssjs-no-switch-default': 'warn',
    'sfmc/ssjs-no-treatascontent-injection': 'warn',
    'sfmc/ssjs-arg-types': 'warn',
    'sfmc/ssjs-core-method-arity': 'warn',
    'no-cond-assign': 'error',
};

const ssjsStrictRules = {
    'sfmc/ssjs-require-platform-load': 'error',
    'sfmc/ssjs-no-unsupported-syntax': 'error',
    'sfmc/ssjs-no-unknown-function': 'error',
    'sfmc/ssjs-no-deprecated-function': 'error',
    'sfmc/ssjs-no-property-call': 'error',
    'sfmc/ssjs-platform-function-arity': 'error',
    'sfmc/ssjs-cache-loop-length': 'error',
    'sfmc/ssjs-require-hasownproperty': 'error',
    'sfmc/ssjs-require-platform-load-order': 'error',
    'sfmc/ssjs-no-hardcoded-credentials': 'error',
    'sfmc/ssjs-prefer-platform-load-version': 'warn',
    'sfmc/ssjs-no-unavailable-method': 'warn',
    'sfmc/ssjs-prefer-parsejson-safe-arg': 'error',
    'sfmc/ssjs-no-switch-default': 'error',
    'sfmc/ssjs-no-treatascontent-injection': 'error',
    'sfmc/ssjs-arg-types': 'warn',
    'sfmc/ssjs-core-method-arity': 'error',
    'no-cond-assign': 'error',
};

// ── Handlebars (MCN) rule sets ────────────────────────────────────────────────

/**
 * Handlebars rules for Marketing Cloud Next targets. Handlebars only exists when
 * targeting MCN, so these are enabled only in `-next` configs and applied to the
 * virtual `.hbs` files the combined processor extracts from HTML.
 */
const hbsNextRules = {
    'sfmc/hbs-no-unknown-helper': 'error',
    'sfmc/hbs-no-unknown-binding': 'error',
    'sfmc/hbs-helper-arity': 'error',
    'sfmc/hbs-no-unsupported-construct': 'error',
    'sfmc/hbs-no-mcn-unsupported': 'error',
};

/**
 * Handlebars rules for non-MCN (classic) targets — all disabled. Classic SFMC
 * does not run Handlebars, so any `{{...}}` is plain content and must not be
 * flagged.
 */
const hbsOffRules = {
    'sfmc/hbs-no-unknown-helper': 'off',
    'sfmc/hbs-no-unknown-binding': 'off',
    'sfmc/hbs-helper-arity': 'off',
    'sfmc/hbs-no-unsupported-construct': 'off',
    'sfmc/hbs-no-mcn-unsupported': 'off',
};

/** Shared languageOptions for linting virtual `.hbs` files. */
const hbsLanguageOptions = { parser: handlebarsParser };

/**
 * Config block(s) for **standalone** `.hbs` files (a real Handlebars file on
 * disk, opened under VS Code's built-in `handlebars` language id). Handlebars
 * only runs on Marketing Cloud Next, so a `.hbs` file is always treated as MCN
 * and the full `hbsNextRules` set applies — no processor is needed because the
 * whole file is Handlebars and is parsed directly. This is deliberately wired
 * only into the `-next` configs; `recommended`/`strict` (MCE) never lint `.hbs`.
 *
 * @param {string} configName - the owning config, used for a unique block name
 * @returns {object[]} a single-entry array with the standalone `.hbs` config
 */
function standaloneHandlebarsConfigs(configName) {
    return [
        {
            name: `sfmc/${configName}-standalone-handlebars`,
            plugins: { sfmc: plugin },
            languageOptions: { ...hbsLanguageOptions },
            files: ['**/*.hbs'],
            rules: { ...hbsNextRules },
        },
    ];
}

// ── Optional eslint-plugin-unicorn override for SSJS ──────────────────────────

/**
 * The 46 `eslint-plugin-unicorn` recommended rules (analysed against
 * unicorn v71.1.0) that are incompatible with the SFMC SSJS (JINT / ES3-ES5)
 * engine — they either autofix code to a missing built-in or forbid a required
 * SFMC workaround, or enforce ES-module / async / ES6-only syntax that the
 * engine cannot run. Each is mapped to `'off'`.
 *
 * This is exposed via the optional `unicorn-ssjs` / `unicorn-ssjs-embedded`
 * configs. eslint-plugin-sfmc does NOT depend on or load unicorn; these configs
 * are plain rules objects (no `plugins` key) and only resolve when the user has
 * loaded their own unicorn config earlier in the flat-config array. See
 * docs/unicorn-compatibility.md for the full rationale and evidence links.
 */
const unicornSsjsOffRules = {
    // Group A — autofix to a missing built-in / forbid a documented SFMC workaround
    'unicorn/prefer-includes': 'off',
    'unicorn/prefer-string-starts-ends-with': 'off',
    'unicorn/prefer-string-trim-start-end': 'off',
    'unicorn/prefer-string-slice': 'off',
    'unicorn/prefer-string-replace-all': 'off',
    'unicorn/prefer-string-repeat': 'off',
    'unicorn/prefer-string-pad-start-end': 'off',
    'unicorn/prefer-string-match-all': 'off',
    'unicorn/prefer-string-raw': 'off',
    'unicorn/prefer-code-point': 'off',
    'unicorn/prefer-array-find': 'off',
    'unicorn/prefer-array-some': 'off',
    'unicorn/prefer-array-index-of': 'off',
    'unicorn/prefer-array-flat': 'off',
    'unicorn/prefer-array-flat-map': 'off',
    'unicorn/prefer-array-last-methods': 'off',
    'unicorn/prefer-array-from-async': 'off',
    'unicorn/no-array-reverse': 'off',
    'unicorn/prefer-at': 'off',
    'unicorn/prefer-negative-index': 'off',
    'unicorn/prefer-spread': 'off',
    'unicorn/prefer-date-now': 'off',
    'unicorn/prefer-object-from-entries': 'off',
    'unicorn/prefer-reflect-apply': 'off',
    'unicorn/prefer-number-properties': 'off',
    'unicorn/prefer-number-is-safe-integer': 'off',
    'unicorn/prefer-number-coercion': 'off',
    'unicorn/prefer-global-number-constants': 'off',
    'unicorn/prefer-native-coercion-functions': 'off',
    'unicorn/prefer-math-trunc': 'off',
    'unicorn/prefer-modern-math-apis': 'off',
    'unicorn/no-instanceof-builtins': 'off',
    'unicorn/no-for-each': 'off',
    'unicorn/prefer-set-has': 'off',
    'unicorn/prefer-set-size': 'off',
    'unicorn/prefer-set-methods': 'off',
    'unicorn/prefer-map-from-entries': 'off',
    'unicorn/prefer-group-by': 'off',
    'unicorn/prefer-iterator-helpers': 'off',
    'unicorn/prefer-structured-clone': 'off',
    'unicorn/require-array-join-separator': 'off',
    // Group B — forbid ES6+ syntax / ES-module / async constructs
    'unicorn/prefer-optional-catch-binding': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/prefer-export-from': 'off',
};

// ── MSO / Outlook email rule configs (auto-included, no separate plugin load) ──

/**
 * Virtual-file globs for the MSO blocks the combined processor appends.
 * sfmc's processor only runs on `**\/*.html`, so MSO blocks are emitted as
 * `email.html/{index}_mso-comments.mso` and `email.html/{index}_document.msohtml`.
 */
const msoVirtualFiles = [`**/*.html/*_${MSO_VIRTUAL_BASENAME}`];
const msoDocumentFiles = [`**/*.html/*_${DOCUMENT_VIRTUAL_BASENAME}`];

/**
 * Returns MSO's two rule-config entries (conditional-comment rules on `.mso`
 * virtual files, document rules on `.msohtml` virtual files) wired to the MSO
 * parsers. The `mso/html-processor` entry from eslint-plugin-mso-email is
 * intentionally omitted — sfmc's own combined processor already emits the MSO
 * blocks, so registering MSO's processor too would create a processor conflict.
 *
 * @returns {import('eslint').Linter.Config[]} MSO conditional + document rule configs.
 */
function msoRuleConfigs() {
    return [
        {
            name: 'sfmc/mso-conditional-rules',
            plugins: { mso: msoPlugin },
            files: msoVirtualFiles,
            languageOptions: { parser: msoEslintParser },
            rules: {
                'mso/valid-mso-condition': 'error',
                'mso/matching-mso-endif': 'error',
                'mso/matching-mso-endif-type': 'warn',
            },
        },
        {
            name: 'sfmc/mso-document-rules',
            plugins: { mso: msoPlugin },
            files: msoDocumentFiles,
            languageOptions: { parser: htmlEslintParser },
            rules: {
                'mso/no-unknown-mso-property': 'warn',
                'mso/vml-requires-namespace': 'warn',
                'mso/no-unknown-vml-tag': 'warn',
                'mso/no-unknown-vml-attribute': 'warn',
                'mso/table-presentation-role': 'warn',
            },
        },
    ];
}

// ── Configs (defined after plugin so they can reference it) ───────────────────

plugin.configs = {
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
        {
            // Classic (non-MCN) HTML: Handlebars is not executed, so all hbs
            // rules are off. The parser is still required so the extracted .hbs
            // virtual file is not handed to espree.
            name: 'sfmc/embedded-handlebars-rules',
            plugins: { sfmc: plugin },
            languageOptions: { ...hbsLanguageOptions },
            files: ['**/*.html/*.hbs'],
            rules: { ...hbsOffRules },
        },
        // MSO / Outlook conditional-comment + VML/CSS checks (auto-included).
        ...msoRuleConfigs(),
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
        {
            // Classic (non-MCN) HTML: Handlebars rules off, parser still wired.
            name: 'sfmc/strict-embedded-handlebars-rules',
            plugins: { sfmc: plugin },
            languageOptions: { ...hbsLanguageOptions },
            files: ['**/*.html/*.hbs'],
            rules: { ...hbsOffRules },
        },
        // MSO / Outlook conditional-comment + VML/CSS checks (auto-included).
        ...msoRuleConfigs(),
    ],

    // ── Marketing Cloud Next configs ──────────────────────────────────────────

    /**
     * AMPscript-only MCN config. Flags functions not supported in MCN.
     * No SSJS portion (AMPscript-only config).
     */
    'ampscript-next': {
        name: 'sfmc/ampscript-next',
        plugins: { sfmc: plugin },
        languageOptions: { parser: ampscriptParser },
        files: ['**/*.ampscript', '**/*.amp'],
        rules: {
            ...ampRecommendedRules,
            'sfmc/amp-no-mcn-unsupported': 'error',
        },
    },

    /**
     * SSJS-only MCN config. Flags all SSJS API calls; disables all other SSJS rules.
     */
    'ssjs-next': {
        name: 'sfmc/ssjs-next',
        plugins: { sfmc: plugin },
        files: ['**/*.ssjs'],
        languageOptions: {
            ecmaVersion: 5,
            sourceType: 'script',
            globals: SSJS_GLOBALS_MAP,
        },
        rules: { ...ssjsMcnRules },
    },

    /**
     * Recommended MCN config: both AMPscript and SSJS for standalone files.
     * AMPscript portion flags MCN-unsupported functions; SSJS portion flags all SSJS as unsupported.
     */
    'recommended-next': [
        {
            name: 'sfmc/recommended-next-ampscript',
            plugins: { sfmc: plugin },
            languageOptions: { parser: ampscriptParser },
            files: ['**/*.ampscript', '**/*.amp'],
            rules: {
                ...ampRecommendedRules,
                'sfmc/amp-no-mcn-unsupported': 'error',
            },
        },
        {
            name: 'sfmc/recommended-next-ssjs',
            plugins: { sfmc: plugin },
            files: ['**/*.ssjs'],
            languageOptions: {
                ecmaVersion: 5,
                sourceType: 'script',
                globals: SSJS_GLOBALS_MAP,
            },
            rules: { ...ssjsMcnRules },
        },
        // Standalone .hbs files are Handlebars templates — always MCN.
        ...standaloneHandlebarsConfigs('recommended-next'),
    ],

    /**
     * MCN config for AMPscript and SSJS embedded in HTML files.
     */
    'embedded-next': [
        {
            name: 'sfmc/embedded-next-processor',
            plugins: { sfmc: plugin },
            files: ['**/*.html'],
            processor: 'sfmc/sfmc',
        },
        {
            name: 'sfmc/embedded-next-ampscript-rules',
            plugins: { sfmc: plugin },
            languageOptions: { parser: ampscriptParser },
            files: ['**/*.html/*.amp'],
            rules: {
                ...ampRecommendedRules,
                'sfmc/amp-no-mcn-unsupported': 'error',
            },
        },
        {
            name: 'sfmc/embedded-next-ssjs-rules',
            plugins: { sfmc: plugin },
            files: ['**/*.html/*.js'],
            languageOptions: {
                ecmaVersion: 5,
                sourceType: 'script',
                globals: SSJS_GLOBALS_MAP,
            },
            rules: { ...ssjsMcnRules },
        },
        {
            // MCN HTML: Handlebars is the templating language — enable hbs rules.
            name: 'sfmc/embedded-next-handlebars-rules',
            plugins: { sfmc: plugin },
            languageOptions: { ...hbsLanguageOptions },
            files: ['**/*.html/*.hbs'],
            rules: { ...hbsNextRules },
        },
        // Standalone .hbs files are Handlebars templates — always MCN.
        ...standaloneHandlebarsConfigs('embedded-next'),
        // MSO / Outlook conditional-comment + VML/CSS checks (auto-included).
        ...msoRuleConfigs(),
    ],

    /**
     * Strict MCN config: all rules at error severity for standalone + embedded.
     */
    'strict-next': [
        {
            name: 'sfmc/strict-next-ampscript',
            plugins: { sfmc: plugin },
            languageOptions: { parser: ampscriptParser },
            files: ['**/*.ampscript', '**/*.amp'],
            rules: {
                ...ampStrictRules,
                'sfmc/amp-no-mcn-unsupported': 'error',
            },
        },
        {
            name: 'sfmc/strict-next-ssjs',
            plugins: { sfmc: plugin },
            files: ['**/*.ssjs'],
            languageOptions: {
                ecmaVersion: 5,
                sourceType: 'script',
                globals: SSJS_GLOBALS_MAP,
            },
            rules: { ...ssjsMcnRules },
        },
        {
            name: 'sfmc/strict-next-embedded-processor',
            plugins: { sfmc: plugin },
            files: ['**/*.html'],
            processor: 'sfmc/sfmc',
        },
        {
            name: 'sfmc/strict-next-embedded-ampscript-rules',
            plugins: { sfmc: plugin },
            languageOptions: { parser: ampscriptParser },
            files: ['**/*.html/*.amp'],
            rules: {
                ...ampStrictRules,
                'sfmc/amp-no-mcn-unsupported': 'error',
            },
        },
        {
            name: 'sfmc/strict-next-embedded-ssjs-rules',
            plugins: { sfmc: plugin },
            files: ['**/*.html/*.js'],
            languageOptions: {
                ecmaVersion: 5,
                sourceType: 'script',
                globals: SSJS_GLOBALS_MAP,
            },
            rules: { ...ssjsMcnRules },
        },
        {
            // MCN HTML (strict): all Handlebars rules at error severity.
            name: 'sfmc/strict-next-embedded-handlebars-rules',
            plugins: { sfmc: plugin },
            languageOptions: { ...hbsLanguageOptions },
            files: ['**/*.html/*.hbs'],
            rules: { ...hbsNextRules },
        },
        // Standalone .hbs files are Handlebars templates — always MCN.
        ...standaloneHandlebarsConfigs('strict-next'),
        // MSO / Outlook conditional-comment + VML/CSS checks (auto-included).
        ...msoRuleConfigs(),
    ],

    // ── Optional eslint-plugin-unicorn override configs ───────────────────────

    /**
     * OPTIONAL: turns off the 46 unicorn recommended rules incompatible with
     * SFMC SSJS, for standalone `.ssjs` files. Plain rules object with NO
     * `plugins` key — eslint-plugin-sfmc does not load unicorn. Spread this
     * AFTER your own unicorn config (which registers the `unicorn` plugin);
     * otherwise ESLint cannot resolve the `unicorn/*` keys. If you don't use
     * unicorn, omit this config entirely.
     */
    'unicorn-ssjs': {
        name: 'sfmc/unicorn-ssjs',
        files: ['**/*.ssjs'],
        rules: { ...unicornSsjsOffRules },
    },

    /**
     * OPTIONAL: same 46-rule override for SSJS embedded in HTML
     * (virtual `**\/*.html/*.js` files). Spread AFTER your unicorn config.
     */
    'unicorn-ssjs-embedded': {
        name: 'sfmc/unicorn-ssjs-embedded',
        files: ['**/*.html/*.js'],
        rules: { ...unicornSsjsOffRules },
    },
};

export default plugin;
