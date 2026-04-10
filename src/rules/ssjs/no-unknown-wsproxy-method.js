/**
 * Rule: no-unknown-wsproxy-method
 *
 * Flags calls to WSProxy instances where the method name does not
 * exist in the known SFMC WSProxy method catalog.
 */

import { wsproxyMethodNames } from 'ssjs-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow calls to unknown WSProxy methods',
        },
        messages: {
            unknownMethod: "'{{name}}' is not a recognized WSProxy method.",
        },
        schema: [],
    },

    create(context) {
        const wsproxyVariables = new Set();

        return {
            VariableDeclaration(node) {
                for (const decl of node.declarations) {
                    if (
                        decl.id &&
                        decl.id.type === 'Identifier' &&
                        decl.init &&
                        decl.init.type === 'NewExpression' &&
                        decl.init.callee.type === 'Identifier' &&
                        decl.init.callee.name === 'WSProxy'
                    ) {
                        wsproxyVariables.add(decl.id.name);
                    }
                }
            },

            AssignmentExpression(node) {
                if (
                    node.left.type === 'Identifier' &&
                    node.right.type === 'NewExpression' &&
                    node.right.callee.type === 'Identifier' &&
                    node.right.callee.name === 'WSProxy'
                ) {
                    wsproxyVariables.add(node.left.name);
                }
            },

            CallExpression(node) {
                const callee = node.callee;
                if (callee.type !== 'MemberExpression') {
                    return;
                }
                if (callee.object.type !== 'Identifier') {
                    return;
                }
                if (callee.property.type !== 'Identifier') {
                    return;
                }

                if (!wsproxyVariables.has(callee.object.name)) {
                    return;
                }

                const methodName = callee.property.name;
                if (!wsproxyMethodNames.has(methodName.toLowerCase())) {
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
