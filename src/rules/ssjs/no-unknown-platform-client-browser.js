/**
 * Rule: no-unknown-platform-client-browser
 *
 * Flags calls to Platform.ClientBrowser.* — this namespace is deprecated.
 * The methods previously under Platform.ClientBrowser.* are now available
 * under Platform.Response.* (e.g. Platform.Response.Redirect,
 * Platform.Response.SetCookie, Platform.Response.RemoveCookie).
 * All Platform.ClientBrowser.* calls are flagged as unknown.
 */

const knownMethods = new Set();

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
                if (callee.type !== 'MemberExpression') {
                    return;
                }

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
