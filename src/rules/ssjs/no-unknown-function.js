/**
 * Rule: ssjs-no-unknown-function
 *
 * Unified rule that replaces the seven narrow no-unknown-* rules.
 * Flags calls to API methods that do not exist in the SFMC catalog:
 *
 *   - Platform.Function.<method>()  — unknown Platform.Function method
 *   - Platform.Variable.<method>()  — unknown Platform.Variable method
 *   - Platform.Request.<method>()   — unknown Platform.Request method
 *   - Platform.Response.<method>()  — unknown Platform.Response method
 *   - Platform.Recipient.<method>() — unknown Platform.Recipient method
 *   - HTTP.<method>()               — unknown HTTP method
 *   - <wsproxyVar>.<method>()       — unknown WSProxy method on a tracked variable
 *   - <coreVar>.<method>()          — unknown method on a tracked Core Library object
 */

import {
    platformFunctionNames,
    PLATFORM_VARIABLE_METHODS,
    PLATFORM_REQUEST_METHODS,
    PLATFORM_RESPONSE_METHODS,
    platformRecipientMethodNames,
    httpMethodNames,
    coreObjectLookup,
    coreObjectNames,
    wsproxyMethodNames,
} from 'ssjs-data';

// Map of lowercase Platform namespace → Set of known lowercase method names
const PLATFORM_NS = new Map([
    ['function', platformFunctionNames],
    ['variable', new Set(PLATFORM_VARIABLE_METHODS.map((m) => m.name.toLowerCase()))],
    ['request', new Set(PLATFORM_REQUEST_METHODS.map((m) => m.name.toLowerCase()))],
    ['response', new Set(PLATFORM_RESPONSE_METHODS.map((m) => m.name.toLowerCase()))],
    ['recipient', platformRecipientMethodNames],
]);

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow calls to unknown SFMC API methods (Platform.*, HTTP.*, Core library, WSProxy)',
        },
        messages: {
            unknownPlatformMethod:
                "'Platform.{{ns}}.{{name}}' is not a recognized SFMC Platform.{{ns}} method.",
            unknownHttpMethod: "'HTTP.{{name}}' is not a recognized SFMC HTTP method.",
            unknownCoreMethod:
                "'{{method}}' is not a known method of {{objectType}}. Available methods: {{available}}.",
            unknownWsproxyMethod: "'{{name}}' is not a recognized WSProxy method.",
        },
        schema: [],
    },

    create(context) {
        // Track variable name → Core Library type name (assigned via TypeName.Init())
        const coreVariables = new Map();
        // Track variable names assigned via new Script.Util.WSProxy()
        const wsproxyVariables = new Set();

        return {
            VariableDeclaration(node) {
                for (const decl of node.declarations) {
                    if (!decl.init || !decl.id || decl.id.type !== 'Identifier') {
                        continue;
                    }
                    const coreType = getCoreInitType(decl.init);
                    if (coreType) {
                        coreVariables.set(decl.id.name, coreType);
                    }
                    if (isWSProxyConstructor(decl.init)) {
                        wsproxyVariables.add(decl.id.name);
                    }
                }
            },

            AssignmentExpression(node) {
                if (node.left.type !== 'Identifier') {
                    return;
                }
                const coreType = getCoreInitType(node.right);
                if (coreType) {
                    coreVariables.set(node.left.name, coreType);
                }
                if (isWSProxyConstructor(node.right)) {
                    wsproxyVariables.add(node.left.name);
                }
            },

            CallExpression(node) {
                const callee = node.callee;
                if (callee.type !== 'MemberExpression') {
                    return;
                }
                const property = callee.property;
                if (property.type !== 'Identifier') {
                    return;
                }

                const methodName = property.name;

                // ── Platform.<NS>.<method>() ──────────────────────────────────
                if (
                    callee.object.type === 'MemberExpression' &&
                    callee.object.object.type === 'Identifier' &&
                    callee.object.object.name === 'Platform' &&
                    callee.object.property.type === 'Identifier'
                ) {
                    const ns = callee.object.property.name.toLowerCase();
                    const knownNames = PLATFORM_NS.get(ns);
                    // Only report if we know this namespace; unknown namespaces are ignored.
                    if (knownNames && !knownNames.has(methodName.toLowerCase())) {
                        context.report({
                            node: property,
                            messageId: 'unknownPlatformMethod',
                            data: { ns: callee.object.property.name, name: methodName },
                        });
                    }
                    return;
                }

                // ── HTTP.<method>() ───────────────────────────────────────────
                if (
                    callee.object.type === 'Identifier' &&
                    callee.object.name === 'HTTP' &&
                    !httpMethodNames.has(methodName.toLowerCase())
                ) {
                    context.report({
                        node: property,
                        messageId: 'unknownHttpMethod',
                        data: { name: methodName },
                    });
                    return;
                }

                // ── Instance method calls (Core Library / WSProxy) ────────────
                if (callee.object.type === 'Identifier') {
                    const objectName = callee.object.name;

                    // Core library: var de = DataExtension.Init("key"); de.Foo();
                    const coreType = coreVariables.get(objectName);
                    if (coreType) {
                        const objectDef = coreObjectLookup.get(coreType);
                        if (objectDef) {
                            const knownMethods = new Set(
                                objectDef.methods.map((m) => m.toLowerCase()),
                            );
                            if (!knownMethods.has(methodName.toLowerCase())) {
                                context.report({
                                    node: property,
                                    messageId: 'unknownCoreMethod',
                                    data: {
                                        method: methodName,
                                        objectType: coreType,
                                        available: objectDef.methods.join(', '),
                                    },
                                });
                            }
                        }
                        return;
                    }

                    // WSProxy: var api = new Script.Util.WSProxy(); api.Foo();
                    if (
                        wsproxyVariables.has(objectName) &&
                        !wsproxyMethodNames.has(methodName.toLowerCase())
                    ) {
                        context.report({
                            node: property,
                            messageId: 'unknownWsproxyMethod',
                            data: { name: methodName },
                        });
                    }
                }
            },
        };
    },
};

/**
 * If `node` is a Core Library Init call (e.g. `DataExtension.Init("key")`),
 * return the Core Library type name; otherwise return null.
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {string | null}
 */
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

/**
 * Returns true if `node` is `new Script.Util.WSProxy()`.
 *
 * @param {import('eslint').Rule.Node} node
 * @returns {boolean}
 */
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
