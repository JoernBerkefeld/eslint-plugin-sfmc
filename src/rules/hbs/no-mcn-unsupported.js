import { getHelper, bindingLookup } from 'handlebars-data';

import { simpleHelperName, isInvocation, BINDING_PATTERN } from './_shared.js';

/**
 * Flags Handlebars helpers and `{!$...}` data bindings that are not available in
 * the targeted Marketing Cloud Next API version.
 *
 * Each helper/binding carries an `mcnSince` value = the MCN API version it first
 * became available in, or `null`/unset when it was never supported in MCN.
 *
 * `apiVersion` semantics (shared with the AMPscript and SSJS MCN rules):
 *   - Not set / null: flag every helper/binding whose `mcnSince` is null/unset.
 *     Any item supported at some point in MCN (numeric `mcnSince`) passes.
 *   - Set to N: flag everything the null case flags, PLUS everything whose
 *     `mcnSince` is greater than N (too new for the target). Pass iff
 *     `mcnSince != null && mcnSince <= N`.
 *
 * The MCN Handlebars catalog currently has no null-`mcnSince` items, so with no
 * `apiVersion` set nothing is flagged; e.g. `apiVersion: 65` flags the helpers
 * introduced in 67, and `apiVersion: 40` flags every helper and binding.
 */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow Handlebars helpers and bindings not available in the targeted Marketing Cloud Next API version',
            recommended: true,
        },
        messages: {
            helperNotSupported: "'{{name}}' is not supported in Marketing Cloud Next Handlebars.",
            helperTooNew:
                "'{{name}}' was introduced in Marketing Cloud Next API version {{since}}, which is newer than the targeted version {{target}}.",
            bindingNotSupported: "'{{token}}' is not supported in Marketing Cloud Next Handlebars.",
            bindingTooNew:
                "'{{token}}' was introduced in Marketing Cloud Next API version {{since}}, which is newer than the targeted version {{target}}.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    apiVersion: {
                        type: 'number',
                        description:
                            'The targeted Marketing Cloud Next API version (e.g. 65 = Winter \u{2019}26, 67 = Summer \u{2019}26). Helpers and bindings newer than this are flagged.',
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] ?? {};
        const apiVersion = typeof options.apiVersion === 'number' ? options.apiVersion : null;

        /**
         * Returns true when an item's `mcnSince` fails the target: it is null
         * (never supported) or newer than the targeted API version.
         *
         * @param {number | null | undefined} since - The item's `mcnSince`.
         * @returns {boolean} True when the item must be flagged.
         */
        function isUnsupported(since) {
            if (since === null || since === undefined) {
                return true;
            }
            return apiVersion !== null && since > apiVersion;
        }

        /**
         * Reports a helper when it is unavailable for the target.
         *
         * @param {object} node - The AST node.
         * @param {string | null} helperName - The simple helper name, when any.
         * @returns {void}
         */
        function checkHelper(node, helperName) {
            if (!helperName) {
                return;
            }
            const helper = getHelper(helperName);
            if (!helper) {
                return;
            }
            const since = helper.mcnSince ?? null;
            if (!isUnsupported(since)) {
                return;
            }
            if (since === null) {
                context.report({
                    node,
                    messageId: 'helperNotSupported',
                    data: { name: helper.name },
                });
            } else {
                context.report({
                    node,
                    messageId: 'helperTooNew',
                    data: {
                        name: helper.name,
                        since: String(since),
                        target: String(apiVersion),
                    },
                });
            }
        }

        /**
         * Checks an inline mustache or subexpression helper invocation.
         *
         * @param {object} node - The AST node.
         * @returns {void}
         */
        function checkInline(node) {
            if (isInvocation(node)) {
                checkHelper(node, simpleHelperName(node.path));
            }
        }

        return {
            MustacheStatement: checkInline,
            SubExpression: checkInline,
            HbsBlockStatement(node) {
                checkHelper(node, simpleHelperName(node.path));
            },
            'Program:exit'() {
                const sourceCode = context.sourceCode ?? context.getSourceCode();
                const text = sourceCode.getText();
                BINDING_PATTERN.lastIndex = 0;
                let match;
                while ((match = BINDING_PATTERN.exec(text)) !== null) {
                    const bindingName = match[1];
                    const binding = bindingLookup.get(bindingName.toLowerCase());
                    // Unknown bindings are handled by hbs-no-unknown-binding.
                    if (!binding) {
                        continue;
                    }
                    const since = binding.mcnSince ?? null;
                    if (!isUnsupported(since)) {
                        continue;
                    }
                    const token = match[0];
                    const start = match.index;
                    const end = start + token.length;
                    const loc = {
                        start: sourceCode.getLocFromIndex(start),
                        end: sourceCode.getLocFromIndex(end),
                    };
                    if (since === null) {
                        context.report({ loc, messageId: 'bindingNotSupported', data: { token } });
                    } else {
                        context.report({
                            loc,
                            messageId: 'bindingTooNew',
                            data: { token, since: String(since), target: String(apiVersion) },
                        });
                    }
                }
            },
        };
    },
};
