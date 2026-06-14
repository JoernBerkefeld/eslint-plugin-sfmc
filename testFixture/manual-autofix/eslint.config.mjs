/**
 * ESLint config for manual auto-fix fixtures.
 * Uses ecmaVersion 2022 for .ssjs so let/?? parse and ssjs-no-unsupported-syntax can fix them.
 */
import sfmc from '../../src/index.js';
import * as ampscriptParser from '../../src/ampscript-parser.js';
import { SSJS_GLOBALS_MAP } from 'ssjs-data';

export default [
    {
        files: ['**/*.ssjs'],
        plugins: { sfmc },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: SSJS_GLOBALS_MAP,
        },
        rules: {
            'sfmc/ssjs-cache-loop-length': 'error',
            'sfmc/ssjs-require-hasownproperty': 'error',
            'sfmc/ssjs-no-unsupported-syntax': 'error',
            'sfmc/ssjs-no-property-call': 'error',
            'sfmc/ssjs-require-platform-load': 'off',
            'sfmc/ssjs-no-unknown-function': 'off',
            'sfmc/ssjs-no-deprecated-function': 'off',
            'sfmc/ssjs-platform-function-arity': 'off',
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
        },
    },
    {
        files: ['**/*.amp'],
        plugins: { sfmc },
        languageOptions: { parser: ampscriptParser },
        rules: {
            'sfmc/amp-require-variable-declaration': 'error',
        },
    },
];
