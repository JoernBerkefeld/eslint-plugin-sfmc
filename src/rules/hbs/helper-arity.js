import { getHelper } from 'handlebars-data';

import { simpleHelperName } from './_shared.js';

/**
 * Enforces correct positional-argument counts for known Marketing Cloud Next
 * Handlebars helpers, derived from each helper's `params` definition.
 *
 * Only positional `params` are checked. Helpers with a variadic trailing param
 * (e.g. `concat`, `and`, `set`) have no upper bound. Hash (named) arguments are
 * not counted as positional arguments.
 */

/**
 * Computes the required and maximum positional argument counts for a helper.
 *
 * @param {object} helper - The helper definition from handlebars-data.
 * @returns {{required: number, max: number}} Required and max positional counts.
 */
function arityOf(helper) {
    const params = helper.params ?? [];
    const hasVariadic = params.some((p) => p.variadic);
    const required = params.filter((p) => !p.optional && !p.variadic).length;
    const max = hasVariadic ? Number.POSITIVE_INFINITY : params.length;
    return { required, max };
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce correct argument counts for known Marketing Cloud Next helpers',
            recommended: true,
        },
        messages: {
            tooFewArgs:
                "'{{name}}' requires at least {{min}} argument(s) but was called with {{actual}}.",
            tooManyArgs:
                "'{{name}}' accepts at most {{max}} argument(s) but was called with {{actual}}.",
        },
        schema: [],
    },

    create(context) {
        /**
         * Validates the positional argument count of a helper invocation.
         *
         * @param {object} node - The AST node (mustache, subexpression, block).
         * @returns {void}
         */
        function check(node) {
            const helperName = simpleHelperName(node.path);
            if (!helperName) {
                return;
            }
            const helper = getHelper(helperName);
            if (!helper) {
                return;
            }

            const actual = node.params?.length ?? 0;

            // A bare `{{foo}}` mustache with no args is a data binding reference,
            // not an invocation — leave arity validation to actual calls.
            if (
                actual === 0 &&
                node.type !== 'HbsBlockStatement' &&
                node.type !== 'SubExpression'
            ) {
                return;
            }

            const { required, max } = arityOf(helper);
            if (actual < required) {
                context.report({
                    node,
                    messageId: 'tooFewArgs',
                    data: { name: helper.name, min: String(required), actual: String(actual) },
                });
                return;
            }
            if (actual > max) {
                context.report({
                    node,
                    messageId: 'tooManyArgs',
                    data: { name: helper.name, max: String(max), actual: String(actual) },
                });
            }
        }

        return {
            MustacheStatement: check,
            SubExpression: check,
            HbsBlockStatement: check,
        };
    },
};
