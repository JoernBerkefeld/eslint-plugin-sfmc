/**
 * ESLint config for manually testing the opt-in `hbs-helper-too-new-for-target`
 * rule. It is OFF in the default `-next` configs, so this folder enables it
 * explicitly for the extracted virtual `.hbs` files with a target API version.
 *
 * apiVersion 65 = Winter '26. Helpers introduced in 67 (Summer '26) — dateAdd,
 * dateDiff, now, timeZoneConversion, getContentBlock, hash, jsonPath, query,
 * queryFirst, raiseError, lookup — are flagged when used here.
 *
 * Imports directly from local source — no npm install needed.
 */
import sfmc from '../../src/index.js';

export default [
    // Base MCN embedded config (processor + amp/ssjs/hbs rules).
    ...sfmc.configs['embedded-next'],
    // Override just the opt-in rule on the extracted virtual .hbs files.
    {
        name: 'sfmc/test-hbs-too-new',
        files: ['**/*.html/*.hbs'],
        rules: {
            'sfmc/hbs-helper-too-new-for-target': ['error', { apiVersion: 65 }],
        },
    },
];
