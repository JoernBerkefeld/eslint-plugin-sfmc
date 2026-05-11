/**
 * Rule: ssjs-core-method-arity
 *
 * Enforces correct argument counts for Core Library object method calls.
 * Covers both instance methods and static calls:
 *
 *   var de = DataExtension.Init("MyDE");
 *   de.Add(rowObj);                    // instance
 *   BounceEvent.Retrieve(filter);      // static single-name
 *   DataExtension.Rows.Add(rowObj);    // static multi-part
 */

import { coreObjectNames, coreMethodArityLookup } from 'ssjs-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce correct argument counts for Core Library object methods',
        },
        messages: {
            tooFewArgs:
                "'{{call}}' requires at least {{min}} argument(s) but was called with {{actual}}.",
            tooManyArgs:
                "'{{call}}' accepts at most {{max}} argument(s) but was called with {{actual}}.",
        },
        schema: [],
    },

    create(context) {
        const coreVars = new Map(); // varName → className

        function checkArity(entry, args, callName, reportNode) {
            if (!entry) {
                return;
            }
            const actual = args.length;
            if (actual < entry.minArgs) {
                context.report({
                    node: reportNode,
                    messageId: 'tooFewArgs',
                    data: { call: callName, min: String(entry.minArgs), actual: String(actual) },
                });
            } else if (actual > entry.maxArgs) {
                context.report({
                    node: reportNode,
                    messageId: 'tooManyArgs',
                    data: { call: callName, max: String(entry.maxArgs), actual: String(actual) },
                });
            }
        }

        return {
            VariableDeclaration(node) {
                for (const decl of node.declarations) {
                    if (!decl.init || !decl.id || decl.id.type !== 'Identifier') {
                        continue;
                    }
                    const coreType = getCoreInitType(decl.init);
                    if (coreType) {
                        coreVars.set(decl.id.name, coreType);
                    }
                }
            },

            AssignmentExpression(node) {
                if (node.left.type !== 'Identifier') {
                    return;
                }
                const coreType = getCoreInitType(node.right);
                if (coreType) {
                    coreVars.set(node.left.name, coreType);
                }
            },

            CallExpression(node) {
                const callee = node.callee;
                if (callee.type !== 'MemberExpression') {
                    return;
                }
                if (callee.property.type !== 'Identifier') {
                    return;
                }
                const methodName = callee.property.name;

                if (callee.object.type === 'Identifier') {
                    const objName = callee.object.name;

                    // Core Library instance method: de.Add(...)
                    const coreType = coreVars.get(objName);
                    if (coreType) {
                        const classLookup = coreMethodArityLookup.get(coreType.toLowerCase());
                        if (classLookup) {
                            const entry = classLookup.get(methodName.toLowerCase());
                            checkArity(
                                entry,
                                node.arguments,
                                `${coreType}.${methodName}`,
                                callee.property,
                            );
                        }
                        return;
                    }

                    // Static single-name: DataExtension.Init(...), BounceEvent.Retrieve(...)
                    if (coreObjectNames.has(objName)) {
                        const classLookup = coreMethodArityLookup.get(objName.toLowerCase());
                        if (classLookup) {
                            const entry = classLookup.get(methodName.toLowerCase());
                            checkArity(
                                entry,
                                node.arguments,
                                `${objName}.${methodName}`,
                                callee.property,
                            );
                        }
                        return;
                    }
                }

                // Static multi-part: DataExtension.Rows.Add(...), TriggeredSend.Tracking.Clicks.Retrieve(...)
                const objectPath = getMemberPath(callee.object);
                if (objectPath && coreObjectNames.has(objectPath)) {
                    const classLookup = coreMethodArityLookup.get(objectPath.toLowerCase());
                    if (classLookup) {
                        const entry = classLookup.get(methodName.toLowerCase());
                        checkArity(
                            entry,
                            node.arguments,
                            `${objectPath}.${methodName}`,
                            callee.property,
                        );
                    }
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
    if (callee.property.type !== 'Identifier' || callee.property.name !== 'Init') {
        return null;
    }
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
    return null;
}

function getMemberPath(node) {
    if (node.type === 'Identifier') {
        return node.name;
    }
    if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
        const obj = getMemberPath(node.object);
        return obj ? `${obj}.${node.property.name}` : null;
    }
    return null;
}
