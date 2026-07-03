import { getHelper } from 'handlebars-data';

import { simpleHelperName, isInvocation } from './_shared.js';

/**
 * Flags known Handlebars helpers whose introducing Marketing Cloud Next API
 * version (`mcnSince`) is newer than the API version the template targets.
 *
 * For example, `dateAdd` first shipped in MCN API version 67 (Summer '26); using
 * it while targeting API version 65 (Winter '26) is reported.
 *
 * The target API version is configured via the `apiVersion` option. When it is
 * omitted, no helper is flagged (all helpers are considered available).
 */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow Handlebars helpers newer than the targeted Marketing Cloud Next API version',
            recommended: true,
        },
        messages: {
            helperTooNew:
                "'{{name}}' was introduced in Marketing Cloud Next API version {{since}}, which is newer than the targeted version {{target}}.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    apiVersion: {
                        type: 'number',
                        description:
                            'The targeted Marketing Cloud Next API version (e.g. 65 = Winter \u{2019}26, 67 = Summer \u{2019}26). Helpers newer than this are flagged.',
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] ?? {};
        const apiVersion = typeof options.apiVersion === 'number' ? options.apiVersion : null;
        if (apiVersion === null) {
            return {};
        }

        /**
         * Reports a helper when its introducing version exceeds the target.
         *
         * @param {object} node - The AST node.
         * @param {string | null} helperName - The simple helper name, when any.
         * @returns {void}
         */
        function check(node, helperName) {
            if (!helperName) {
                return;
            }
            const helper = getHelper(helperName);
            if (helper && helper.mcnSince > apiVersion) {
                context.report({
                    node,
                    messageId: 'helperTooNew',
                    data: {
                        name: helper.name,
                        since: String(helper.mcnSince),
                        target: String(apiVersion),
                    },
                });
            }
        }

        /**
         * Checks an inline mustache or subexpression invocation.
         *
         * @param {object} node - The AST node.
         * @returns {void}
         */
        function checkInline(node) {
            if (isInvocation(node)) {
                check(node, simpleHelperName(node.path));
            }
        }

        return {
            MustacheStatement: checkInline,
            SubExpression: checkInline,
            HbsBlockStatement(node) {
                check(node, simpleHelperName(node.path));
            },
        };
    },
};
