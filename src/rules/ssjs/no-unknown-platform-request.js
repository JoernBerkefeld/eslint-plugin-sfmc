/**
 * Rule: no-unknown-platform-request
 *
 * Flags calls to Platform.Request.* where the method name does not
 * exist in the known SFMC Platform.Request catalog.
 */

import { PLATFORM_REQUEST_METHODS } from 'ssjs-data';

const knownMethods = new Set(PLATFORM_REQUEST_METHODS.map((m) => m.name.toLowerCase()));

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow calls to unknown Platform.Request methods',
        },
        messages: {
            unknownMethod: "'Platform.Request.{{name}}' is not a recognized method.",
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
                    callee.object.property.name === 'Request' &&
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
