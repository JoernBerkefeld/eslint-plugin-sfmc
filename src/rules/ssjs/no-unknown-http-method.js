/**
 * Rule: no-unknown-http-method
 *
 * Flags calls to HTTP.* where the method name does not exist
 * in the known SFMC HTTP method catalog.
 */

import { httpMethodNames } from 'ssjs-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow calls to unknown HTTP object methods',
        },
        messages: {
            unknownMethod: "'HTTP.{{name}}' is not a recognized SFMC HTTP method.",
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
                if (callee.object.type !== 'Identifier' || callee.object.name !== 'HTTP') {
                    return;
                }
                if (callee.property.type !== 'Identifier') {
                    return;
                }

                const methodName = callee.property.name;
                if (!httpMethodNames.has(methodName.toLowerCase())) {
                    context.report({
                        node: callee.property,
                        messageId: 'unknownMethod',
                        data: { name: methodName },
                    });
                }
            },
        };
    },
};
