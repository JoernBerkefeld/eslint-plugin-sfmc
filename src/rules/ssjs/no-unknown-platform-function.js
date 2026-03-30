/**
 * Rule: no-unknown-platform-function
 *
 * Flags calls to Platform.Function.* where the method name does not
 * exist in the known SFMC Platform.Function catalog.
 */

import { platformFunctionNames } from 'ssjs-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow calls to unknown Platform.Function methods',
        },
        messages: {
            unknownFunction:
                "'Platform.Function.{{name}}' is not a recognized SFMC Platform function.",
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                const callee = node.callee;
                if (callee.type !== 'MemberExpression') return;

                if (
                    callee.object.type === 'MemberExpression' &&
                    callee.object.object.type === 'Identifier' &&
                    callee.object.object.name === 'Platform' &&
                    callee.object.property.type === 'Identifier' &&
                    callee.object.property.name === 'Function' &&
                    callee.property.type === 'Identifier'
                ) {
                    const methodName = callee.property.name;
                    if (!platformFunctionNames.has(methodName.toLowerCase())) {
                        context.report({
                            node: callee.property,
                            messageId: 'unknownFunction',
                            data: { name: methodName },
                        });
                    }
                }
            },
        };
    },
};
