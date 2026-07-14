/**
 * Rule: ssjs-no-nonexistent-global
 *
 * Flags bare-name SSJS globals that are officially documented but proven NOT to
 * exist at runtime — calling them throws a ReferenceError. Currently covers:
 *
 *   - Redirect(url, movedPermanently) — undefined under every Core version;
 *     use Platform.Response.Redirect(url, movedPermanently) instead.
 *
 * The offending names come from ssjs-data's `notDefinedAtRuntime` flag, so new
 * phantom globals are picked up automatically without editing this rule.
 */

import { notDefinedAtRuntimeGlobalLookup } from 'ssjs-data';

/**
 * Extract a runtime-safe replacement suggestion for a phantom global from its
 * ssjs-data entry. Prefers the `Platform.*` call named in the officialDocsNote,
 * falling back to a generic hint.
 *
 * @param {object} entry - The ssjs-data global entry.
 * @returns {string} A replacement suggestion (e.g. `Platform.Response.Redirect(...)`).
 */
function replacementFor(entry) {
    const source = `${entry.officialDocsNote ?? ''} ${entry.description ?? ''}`;
    const match = source.match(/Platform\.[A-Za-z.]+\([^)]*\)/);
    return match ? match[0] : 'a supported alternative';
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow SSJS globals that are documented but do not exist at runtime (throw ReferenceError)',
        },
        messages: {
            nonexistentGlobal:
                "'{{name}}' does not exist at runtime (calling it throws a ReferenceError). Use {{replacement}} instead.",
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                const callee = node.callee;
                if (callee.type !== 'Identifier') {
                    return;
                }
                const entry = notDefinedAtRuntimeGlobalLookup.get(callee.name.toLowerCase());
                if (!entry) {
                    return;
                }
                context.report({
                    node: callee,
                    messageId: 'nonexistentGlobal',
                    data: { name: callee.name, replacement: replacementFor(entry) },
                });
            },
        };
    },
};
