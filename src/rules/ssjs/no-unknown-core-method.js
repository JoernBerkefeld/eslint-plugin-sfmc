/**
 * Rule: no-unknown-core-method
 *
 * Flags calls to Core library object methods that don't exist on that
 * object type, when the object type can be inferred from an Init call.
 *
 * Example:
 *   var de = DataExtension.Init("MyDE");
 *   de.Foo();  // error: 'Foo' is not a method of DataExtension
 */

import { coreObjectLookup, coreObjectNames } from 'ssjs-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: "Disallow calls to methods that don't exist on a Core library object",
        },
        messages: {
            unknownMethod:
                "'{{method}}' is not a known method of {{objectType}}. Available methods: {{available}}.",
        },
        schema: [],
    },

    create(context) {
        const variableTypes = new Map();

        return {
            VariableDeclaration(node) {
                for (const decl of node.declarations) {
                    if (!decl.init || !decl.id || decl.id.type !== 'Identifier') {
                        continue;
                    }
                    const coreType = getCoreInitType(decl.init);
                    if (coreType) {
                        variableTypes.set(decl.id.name, coreType);
                    }
                }
            },

            AssignmentExpression(node) {
                if (node.left.type !== 'Identifier') {
                    return;
                }
                const coreType = getCoreInitType(node.right);
                if (coreType) {
                    variableTypes.set(node.left.name, coreType);
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

                const objectName = callee.object.name;
                const method = callee.property.name;

                const coreType = variableTypes.get(objectName);
                if (!coreType) {
                    return;
                }

                const objectDef = coreObjectLookup.get(coreType);
                if (!objectDef) {
                    return;
                }

                const knownMethods = new Set(objectDef.methods.map((m) => m.toLowerCase()));
                if (!knownMethods.has(method.toLowerCase())) {
                    context.report({
                        node: callee.property,
                        messageId: 'unknownMethod',
                        data: {
                            method,
                            objectType: coreType,
                            available: objectDef.methods.join(', '),
                        },
                    });
                }
            },
        };
    },
};

function getCoreInitType(node) {
    if (!node || node.type !== 'CallExpression') {
        return null;
    }
    const callee = node.callee;
    if (callee.type !== 'MemberExpression') {
        return null;
    }

    if (callee.property.type === 'Identifier' && callee.property.name === 'Init') {
        if (callee.object.type === 'Identifier' && coreObjectNames.has(callee.object.name)) {
            return callee.object.name;
        }
        if (
            callee.object.type === 'MemberExpression' &&
            callee.object.object.type === 'Identifier' &&
            callee.object.property.type === 'Identifier'
        ) {
            const fullName = `${callee.object.object.name}.${callee.object.property.name}`;
            if (coreObjectNames.has(fullName)) {
                return fullName;
            }
        }
    }

    return null;
}
