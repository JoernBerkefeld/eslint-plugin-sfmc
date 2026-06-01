/**
 * Rule: ssjs-arg-types
 *
 * Checks that literal arguments match the expected parameter types for known
 * SSJS functions and methods. Only literal values are checked — variable
 * arguments are skipped because their type cannot be determined statically.
 *
 * Covers:
 *   - Platform.Function.*, Platform.Variable.*, Platform.Response.*,
 *     Platform.Request.*, Platform.Recipient.*
 *   - HTTP.*, HTTPHeader.*, Attribute.*
 *   - WSProxy instance methods
 *   - Core Library static calls (DataExtension.Init, BounceEvent.Retrieve, …)
 *   - Core Library instance methods (var de = DataExtension.Init(…); de.Add(…))
 *   - Global functions (Format, String, Error)
 */

import {
    platformFunctionLookup,
    platformResponseLookup,
    platformVariableLookup,
    platformRequestLookup,
    platformRecipientLookup,
    httpMethodLookup,
    httpHeaderMethodLookup,
    wsproxyMethodLookup,
    attributeMethodLookup,
    ssjsGlobalsLookup,
    coreMethodArityLookup,
    coreObjectNames,
} from 'ssjs-data';

// Platform.SubNS → lookup Map
const PLATFORM_SUBNS_LOOKUPS = new Map([
    ['function', platformFunctionLookup],
    ['variable', platformVariableLookup],
    ['response', platformResponseLookup],
    ['request', platformRequestLookup],
    ['recipient', platformRecipientLookup],
]);

// Top-level non-Platform objects with static method lookups
const TOPLEVEL_LOOKUPS = new Map([
    ['http', httpMethodLookup],
    ['httpheader', httpHeaderMethodLookup],
    ['attribute', attributeMethodLookup],
]);

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Check that literal arguments match expected parameter types for SSJS functions',
        },
        messages: {
            typeMismatch:
                "Argument {{pos}} ('{{param}}') of '{{call}}' expects type '{{expected}}' but received '{{actual}}'.",
        },
        schema: [],
    },

    create(context) {
        const coreVars = new Map(); // varName → className (Core Library instances)
        const wsproxyVars = new Set(); // varNames assigned new Script.Util.WSProxy()

        function checkArgs(entry, args, callName) {
            if (!entry || !entry.params || entry.params.length === 0) {
                return;
            }
            for (const [i, arg] of args.entries()) {
                const param = entry.params[i];
                if (!param) {
                    break;
                } // beyond declared params — arity rule handles this
                if (!param.type || param.type === 'any') {
                    continue;
                }
                const actual = inferArgType(arg);
                if (actual === null) {
                    continue;
                } // unknown type (variable/call) — skip
                if (!isTypeCompatible(actual, param.type)) {
                    context.report({
                        node: arg,
                        messageId: 'typeMismatch',
                        data: {
                            pos: String(i + 1),
                            param: param.name,
                            call: callName,
                            expected: param.type,
                            actual,
                        },
                    });
                }
            }
        }

        return {
            VariableDeclaration(node) {
                for (const decl of node.declarations) {
                    if (!decl.init || !decl.id || decl.id.type !== 'Identifier') {
                        continue;
                    }
                    if (isWSProxyConstructor(decl.init)) {
                        wsproxyVars.add(decl.id.name);
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
                if (isWSProxyConstructor(node.right)) {
                    wsproxyVars.add(node.left.name);
                    return;
                }
                const coreType = getCoreInitType(node.right);
                if (coreType) {
                    coreVars.set(node.left.name, coreType);
                }
            },

            CallExpression(node) {
                const callee = node.callee;

                // Global function: Format(...), String(...), Error(...)
                if (callee.type === 'Identifier') {
                    const entry = ssjsGlobalsLookup.get(callee.name.toLowerCase());
                    if (entry) {
                        checkArgs(entry, node.arguments, callee.name);
                    }
                    return;
                }

                if (callee.type !== 'MemberExpression') {
                    return;
                }
                if (callee.property.type !== 'Identifier') {
                    return;
                }
                const methodName = callee.property.name;

                // Platform.SubNS.Method(...): Platform.Function.X, Platform.Response.X, …
                if (
                    callee.object.type === 'MemberExpression' &&
                    callee.object.object.type === 'Identifier' &&
                    callee.object.object.name === 'Platform' &&
                    callee.object.property.type === 'Identifier'
                ) {
                    const subNs = callee.object.property.name.toLowerCase();
                    const lookup = PLATFORM_SUBNS_LOOKUPS.get(subNs);
                    if (lookup) {
                        const entry = lookup.get(methodName.toLowerCase());
                        if (entry) {
                            checkArgs(
                                entry,
                                node.arguments,
                                `Platform.${callee.object.property.name}.${methodName}`,
                            );
                        }
                    }
                    return;
                }

                if (callee.object.type === 'Identifier') {
                    const objName = callee.object.name;
                    const objLower = objName.toLowerCase();

                    // Static top-level: HTTP.Post(...), HTTPHeader.SetValue(...), Attribute.GetValue(...)
                    const topLookup = TOPLEVEL_LOOKUPS.get(objLower);
                    if (topLookup) {
                        const entry = topLookup.get(methodName.toLowerCase());
                        if (entry) {
                            checkArgs(entry, node.arguments, `${objName}.${methodName}`);
                        }
                        return;
                    }

                    // WSProxy instance method: proxy.Retrieve(...)
                    if (wsproxyVars.has(objName)) {
                        const entry = wsproxyMethodLookup.get(methodName.toLowerCase());
                        if (entry) {
                            checkArgs(entry, node.arguments, `WSProxy.${methodName}`);
                        }
                        return;
                    }

                    // Core Library instance method: de.Add(...)
                    const coreType = coreVars.get(objName);
                    if (coreType) {
                        const classLookup = coreMethodArityLookup.get(coreType.toLowerCase());
                        if (classLookup) {
                            const entry = classLookup.get(methodName.toLowerCase());
                            if (entry) {
                                checkArgs(entry, node.arguments, `${coreType}.${methodName}`);
                            }
                        }
                        return;
                    }

                    // Static Core Library single-name: DataExtension.Init(...), BounceEvent.Retrieve(...)
                    if (coreObjectNames.has(objName)) {
                        const classLookup = coreMethodArityLookup.get(objLower);
                        if (classLookup) {
                            const entry = classLookup.get(methodName.toLowerCase());
                            if (entry) {
                                checkArgs(entry, node.arguments, `${objName}.${methodName}`);
                            }
                        }
                    }
                    return;
                }

                // Multi-part static: DataExtension.Rows.Add(...), TriggeredSend.Tracking.Clicks.Retrieve(...)
                const objectPath = getMemberPath(callee.object);
                if (objectPath && coreObjectNames.has(objectPath)) {
                    const classLookup = coreMethodArityLookup.get(objectPath.toLowerCase());
                    if (classLookup) {
                        const entry = classLookup.get(methodName.toLowerCase());
                        if (entry) {
                            checkArgs(entry, node.arguments, `${objectPath}.${methodName}`);
                        }
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

function inferArgType(node) {
    if (!node || node.type === 'SpreadElement') {
        return null;
    }
    if (node.type === 'Literal') {
        if (typeof node.value === 'string') {
            return 'string';
        }
        if (typeof node.value === 'number') {
            return 'number';
        }
        if (typeof node.value === 'boolean') {
            return 'boolean';
        }
        if (node.value === null) {
            return 'null';
        }
    }
    if (node.type === 'TemplateLiteral' && !node.tag) {
        return 'string';
    }
    if (node.type === 'ArrayExpression') {
        const elems = node.elements.filter(Boolean);
        if (elems.length === 0) {
            return 'array';
        }
        if (elems.every((e) => e.type === 'Literal' && typeof e.value === 'string')) {
            return 'string[]';
        }
        if (elems.every((e) => e.type === 'Literal' && typeof e.value === 'number')) {
            return 'number[]';
        }
        return 'array';
    }
    if (node.type === 'ObjectExpression') {
        return 'object';
    }
    return null;
}

function isTypeCompatible(actual, expected) {
    if (!expected || expected === 'any') {
        return true;
    }
    const allowed = expected.split('|').map((t) => t.trim());
    if (allowed.includes(actual)) {
        return true;
    }
    // 'array' is compatible with typed array variants
    if (allowed.includes('array') && (actual === 'string[]' || actual === 'number[]')) {
        return true;
    }
    return false;
}

function isWSProxyConstructor(node) {
    if (!node || node.type !== 'NewExpression') {
        return false;
    }
    const c = node.callee;
    return (
        c.type === 'MemberExpression' &&
        c.property.type === 'Identifier' &&
        c.property.name === 'WSProxy' &&
        c.object.type === 'MemberExpression' &&
        c.object.property.type === 'Identifier' &&
        c.object.property.name === 'Util' &&
        c.object.object.type === 'Identifier' &&
        c.object.object.name === 'Script'
    );
}
