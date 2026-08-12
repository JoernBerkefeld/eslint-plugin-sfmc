/**
 * Rule: no-nonfunctional-function
 *
 * Flags calls to AMPscript functions that resolve at runtime but have no known
 * working invocation (ampscript-data `nonFunctionalAtRuntime`). Unlike an unknown
 * function, these DO exist in the catalog (so they remain in completions and
 * hover), but every reached call aborts the page — e.g. `GetPortfolioItem` and
 * the MSCRM family, whose underlying Classic feature is retired.
 *
 * Kept separate from `no-deprecated-function` because these functions were never
 * formally deprecated by Salesforce; the failure is a retired platform feature,
 * not a sunset notice. Reported as a problem with no auto-fix (no replacement
 * exists). Mirrors the SSJS `ssjs-no-nonfunctional-method` rule.
 */

import { nonFunctionalFunctionLookup } from 'ampscript-data';

/**
 * Extract a short factual pointer from an entry's officialDocsNote (first
 * sentence) for the warning message. Returns an empty string when absent.
 *
 * @param {object} entry - ampscript-data function entry
 * @returns {string} A short note, or empty string
 */
function shortNote(entry) {
    if (!entry || typeof entry.officialDocsNote !== 'string') {
        return '';
    }
    const trimmed = entry.officialDocsNote.trim();
    if (trimmed === '') {
        return '';
    }
    const sentenceEnd = trimmed.indexOf('. ');
    return sentenceEnd === -1 ? trimmed : trimmed.slice(0, sentenceEnd + 1);
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow AMPscript functions that resolve at runtime but have no known working invocation',
        },
        hasSuggestions: false,
        messages: {
            nonFunctional:
                "'{{name}}' exists in SFMC but has no known working invocation at runtime (every tested call aborts the page). {{note}}",
        },
        schema: [],
    },

    create(context) {
        return {
            FunctionCall(node) {
                const functionName = node.name || (node.callee && node.callee.name) || '';
                if (!functionName) {
                    return;
                }

                const entry = nonFunctionalFunctionLookup.get(functionName.toLowerCase());
                if (!entry) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'nonFunctional',
                    data: { name: functionName, note: shortNote(entry) },
                });
            },
        };
    },
};
