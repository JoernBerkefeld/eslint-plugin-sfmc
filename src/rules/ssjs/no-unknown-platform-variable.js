/**
 * Rule: no-unknown-platform-variable
 *
 * Flags calls to Platform.Variable.* where the method name does not
 * exist in the known SFMC Platform.Variable catalog.
 */

import { PLATFORM_VARIABLE_METHODS } from 'ssjs-data';

const knownMethods = new Set(PLATFORM_VARIABLE_METHODS.map((m) => m.name.toLowerCase()));

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow calls to unknown Platform.Variable methods',
        },
        messages: {
            unknownMethod: "'Platform.Variable.{{name}}' is not a recognized method.",
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
                    callee.object.property.name === 'Variable' &&
                    callee.property.type === 'Identifier'
                ) {
                    const methodName = callee.property.name;
                    if (!knownMethods.has(methodName.toLowerCase())) {
                        context.report({
                            node: callee.property,
                            messageId: 'unknownMethod',
                            data: { name: methodName },
                        });
                    }
                }
            },
        };
    },
};
