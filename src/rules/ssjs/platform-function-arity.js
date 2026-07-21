/**
 * Rule: platform-function-arity
 *
 * Enforces correct argument counts for Platform.Function.* calls
 * using arity metadata from ssjs-data.
 */

import { platformFunctionLookup } from 'ssjs-data';

/**
 * Render a set of permitted argument counts as human-readable text,
 * e.g. `[1, 6]` → "1 or 6" and `[1, 3, 6]` → "1, 3 or 6".
 *
 * @param {number[]} arities - The permitted argument counts.
 * @returns {string} The rendered list.
 */
function formatArities(arities) {
    if (arities.length === 1) {
        return String(arities[0]);
    }
    return `${arities.slice(0, -1).join(', ')} or ${arities.at(-1)}`;
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce correct argument counts for Platform.Function methods',
        },
        messages: {
            tooFewArgs:
                "'Platform.Function.{{name}}' requires at least {{min}} argument(s) but was called with {{actual}}.",
            tooManyArgs:
                "'Platform.Function.{{name}}' accepts at most {{max}} argument(s) but was called with {{actual}}.",
            invalidArity:
                "'Platform.Function.{{name}}' must be called with exactly {{arities}} arguments (got {{actual}}); intermediate argument counts throw at runtime.",
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                const callee = node.callee;
                if (callee.type !== 'MemberExpression') {
                    return;
                }

                if (
                    callee.object.type === 'MemberExpression' &&
                    callee.object.object.type === 'Identifier' &&
                    callee.object.object.name === 'Platform' &&
                    callee.object.property.type === 'Identifier' &&
                    callee.object.property.name === 'Function' &&
                    callee.property.type === 'Identifier'
                ) {
                    const methodName = callee.property.name;
                    const entry = platformFunctionLookup.get(methodName.toLowerCase());
                    if (!entry) {
                        return;
                    }

                    const actual = node.arguments.length;

                    if (actual < entry.minArgs) {
                        context.report({
                            node: callee.property,
                            messageId: 'tooFewArgs',
                            data: {
                                name: entry.name,
                                min: String(entry.minArgs),
                                actual: String(actual),
                            },
                        });
                    } else if (actual > entry.maxArgs) {
                        context.report({
                            node: callee.property,
                            messageId: 'tooManyArgs',
                            data: {
                                name: entry.name,
                                max: String(entry.maxArgs),
                                actual: String(actual),
                            },
                        });
                    } else if (
                        Array.isArray(entry.validArities) &&
                        !entry.validArities.includes(actual)
                    ) {
                        // Discontinuous overload: actual is within [minArgs, maxArgs]
                        // but not one of the exact permitted arities (e.g. HTTPGet
                        // accepts only 1 or 6 arguments; 2-5 throw at runtime).
                        context.report({
                            node: callee.property,
                            messageId: 'invalidArity',
                            data: {
                                name: entry.name,
                                arities: formatArities(entry.validArities),
                                actual: String(actual),
                            },
                        });
                    }
                }
            },
        };
    },
};
