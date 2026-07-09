/**
 * ESLint config for manually testing the `apiVersion` option shared by the three
 * MCN rules: `amp-no-mcn-unsupported`, `ssjs-no-mcn-unsupported`, and
 * `hbs-no-mcn-unsupported`.
 *
 * The default `-next` configs enable those rules with no `apiVersion` (only
 * never-in-MCN items are flagged). This folder pins apiVersion: 65 (Winter '26)
 * so items introduced in 67 (Summer '26) are additionally flagged as "too new
 * for target":
 *   - Handlebars helpers: dateAdd, dateDiff, now, timeZoneConversion,
 *     getContentBlock, hash, jsonPath, query, queryFirst, raiseError, lookup.
 *   - AMPscript functions whose `mcnSince` is 67.
 *
 * SSJS is never supported in MCN, so `apiVersion` has no effect there — all SSJS
 * usage is flagged regardless.
 *
 * Imports directly from local source — no npm install needed.
 */
import sfmc from '../../src/index.js';

/** The targeted Marketing Cloud Next API version for this fixture folder. */
const apiVersion = 65;

export default [
    // Standalone .amp and .ssjs files — MCN mode.
    ...sfmc.configs['recommended-next'],
    // Embedded AMPscript / SSJS / Handlebars inside .html files — MCN mode.
    ...sfmc.configs['embedded-next'],
    // Pin the apiVersion on the AMPscript MCN rule (standalone + embedded).
    {
        name: 'sfmc/test-amp-apiversion',
        files: ['**/*.amp', '**/*.ampscript', '**/*.html/*.amp'],
        rules: {
            'sfmc/amp-no-mcn-unsupported': ['error', { apiVersion }],
        },
    },
    // Pin the apiVersion on the SSJS MCN rule (accepted for parity; no effect).
    {
        name: 'sfmc/test-ssjs-apiversion',
        files: ['**/*.ssjs', '**/*.html/*.js'],
        rules: {
            'sfmc/ssjs-no-mcn-unsupported': ['error', { apiVersion }],
        },
    },
    // Pin the apiVersion on the Handlebars MCN rule (extracted virtual .hbs).
    {
        name: 'sfmc/test-hbs-apiversion',
        files: ['**/*.html/*.hbs'],
        rules: {
            'sfmc/hbs-no-mcn-unsupported': ['error', { apiVersion }],
        },
    },
];
