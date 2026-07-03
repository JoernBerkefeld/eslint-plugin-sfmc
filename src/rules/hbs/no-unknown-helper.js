import { isHelper, helperNames } from 'handlebars-data';

import { simpleHelperName, isInvocation, closestMatch } from './_shared.js';

/**
 * Flags Handlebars helper invocations whose name is not part of the Marketing
 * Cloud Next catalog. The MCN engine is locked down and cannot register custom
 * helpers, so any unknown helper is reported.
 *
 * Mirrors the `handlebars/unknown-helper` diagnostic emitted by
 * sfmc-language-lsp. A bare `{{foo}}` mustache with no arguments is treated as a
 * data binding (not a helper) and is not flagged here.
 */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow Handlebars helper invocations that are not part of the Marketing Cloud Next catalog',
            recommended: true,
        },
        messages: {
            unknownHelper:
                "Unknown Handlebars {{kind}} '{{name}}'. It is not part of the Marketing Cloud Next catalog, and the MCN engine cannot register custom helpers.",
            unknownHelperSuggest:
                "Unknown Handlebars {{kind}} '{{name}}'. It is not part of the Marketing Cloud Next catalog, and the MCN engine cannot register custom helpers. Did you mean '{{suggestion}}'?",
        },
        schema: [],
    },

    create(context) {
        /**
         * Reports an unknown helper, attaching a "did you mean" suggestion when
         * a close catalog match exists.
         *
         * @param {object} node - The offending AST node.
         * @param {string} name - The unknown helper name.
         * @param {boolean} isBlock - True when the node is a block helper.
         * @returns {void}
         */
        function reportUnknown(node, name, isBlock) {
            const kind = isBlock ? 'block helper' : 'helper';
            const suggestion = closestMatch(name, helperNames);
            if (suggestion) {
                context.report({
                    node,
                    messageId: 'unknownHelperSuggest',
                    data: { kind, name, suggestion },
                });
            } else {
                context.report({ node, messageId: 'unknownHelper', data: { kind, name } });
            }
        }

        /**
         * Checks an inline mustache or subexpression invocation.
         *
         * @param {object} node - The AST node.
         * @returns {void}
         */
        function checkInline(node) {
            const helperName = simpleHelperName(node.path);
            if (helperName && isInvocation(node) && !isHelper(helperName)) {
                reportUnknown(node, helperName, false);
            }
        }

        return {
            MustacheStatement: checkInline,
            SubExpression: checkInline,
            HbsBlockStatement(node) {
                const helperName = simpleHelperName(node.path);
                if (helperName && !isHelper(helperName)) {
                    reportUnknown(node, helperName, true);
                }
            },
        };
    },
};
