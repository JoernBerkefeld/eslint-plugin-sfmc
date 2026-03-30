/**
 * Rule: no-unknown-platform-client-browser
 *
 * Flags calls to Platform.ClientBrowser.* where the method name does not
 * exist in the known SFMC Platform.ClientBrowser catalog.
 */

import { PLATFORM_CLIENT_BROWSER_METHODS } from 'ssjs-data';

const knownMethods = new Set(PLATFORM_CLIENT_BROWSER_METHODS.map((m) => m.name.toLowerCase()));

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow calls to unknown Platform.ClientBrowser methods',
        },
        messages: {
            unknownMethod: "'Platform.ClientBrowser.{{name}}' is not a recognized method.",
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
                    callee.object.property.name === 'ClientBrowser' &&
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
