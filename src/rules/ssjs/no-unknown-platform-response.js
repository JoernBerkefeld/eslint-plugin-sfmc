/**
 * Rule: no-unknown-platform-response
 *
 * Flags calls to Platform.Response.* where the method name does not
 * exist in the known SFMC Platform.Response catalog.
 */

import { PLATFORM_RESPONSE_METHODS } from 'ssjs-data';

const knownMethods = new Set(PLATFORM_RESPONSE_METHODS.map((m) => m.name.toLowerCase()));

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow calls to unknown Platform.Response methods',
        },
        messages: {
            unknownMethod: "'Platform.Response.{{name}}' is not a recognized method.",
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
                    callee.object.property.name === 'Response' &&
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
