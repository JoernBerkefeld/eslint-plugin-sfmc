/**
 * Rule: platform-function-arity
 *
 * Enforces correct argument counts for Platform.Function.* calls
 * using arity metadata from ssjs-data.
 */

import { platformFunctionLookup } from 'ssjs-data';

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
                    }
                }
            },
        };
    },
};
