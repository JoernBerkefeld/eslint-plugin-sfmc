/**
 * Rule: ssjs-no-mcn-unsupported
 *
 * Server-Side JavaScript as a whole is not available in Marketing Cloud Next.
 * When targeting MCN, every SSJS API usage must be rewritten in AMPscript or
 * Handlebars. This rule flags all SSJS API surface usage:
 *
 *   - Platform.<...>()              — any Platform namespace call (incl. Platform.Load)
 *   - HTTP.<method>()               — any HTTP call
 *   - <coreVar>.<method>()          — Core Library instance calls
 *   - <wsproxyVar>.<method>()       — WSProxy instance calls
 *   - new Script.Util.WSProxy()     — WSProxy construction
 *
 * The `apiVersion` option is accepted for parity with the AMPscript and
 * Handlebars MCN rules, but currently has no effect: no MCN API version
 * supports SSJS, so it always flags all SSJS usage.
 */

import { coreObjectNames } from 'ssjs-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow all Server-Side JavaScript API usage, which is unavailable in Marketing Cloud Next',
        },
        messages: {
            ssjsNotSupportedInMcn:
                'SSJS is not supported in Marketing Cloud Next. Rewrite this code in AMPscript or Handlebars.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    apiVersion: {
                        type: 'number',
                        description:
                            'Targeted Marketing Cloud Next API version. Accepted for parity with the other MCN rules; currently has no effect because no version supports SSJS.',
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        // Track variable name → Core Library type name (assigned via TypeName.Init())
        const coreVariables = new Map();
        // Track variable names assigned via new Script.Util.WSProxy()
        const wsproxyVariables = new Set();

        return {
            VariableDeclaration(node) {
                for (const declaration of node.declarations) {
                    if (
                        !declaration.init ||
                        !declaration.id ||
                        declaration.id.type !== 'Identifier'
                    ) {
                        continue;
                    }
                    const coreType = getCoreInitType(declaration.init);
                    if (coreType) {
                        coreVariables.set(declaration.id.name, coreType);
                    }
                    if (isWSProxyConstructor(declaration.init)) {
                        wsproxyVariables.add(declaration.id.name);
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

            NewExpression(node) {
                if (isWSProxyConstructor(node)) {
                    context.report({ node: node.callee, messageId: 'ssjsNotSupportedInMcn' });
                }
            },

            CallExpression(node) {
                const callee = node.callee;
                if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') {
                    return;
                }

                // Traverse the object chain to find the root identifier
                // (handles de.Rows.Retrieve() where root is `de`,
                //  and Platform.Function.X() where root is `Platform`).
                let rootNode = callee.object;
                while (rootNode.type === 'MemberExpression') {
                    rootNode = rootNode.object;
                }
                if (rootNode.type !== 'Identifier') {
                    return;
                }
                const rootName = rootNode.name;

                const isSfmcApiCall =
                    rootName === 'Platform' ||
                    rootName === 'HTTP' ||
                    coreVariables.has(rootName) ||
                    wsproxyVariables.has(rootName);

                if (isSfmcApiCall) {
                    context.report({
                        node: callee.property,
                        messageId: 'ssjsNotSupportedInMcn',
                    });
                }
            },
        };
    },
};

/**
 * If `node` is a Core Library Init call (e.g. `DataExtension.Init("key")`),
 * return the Core Library type name; otherwise return null.
 *
 * @param {import('eslint').Rule.Node} node - AST node to inspect
 * @returns {string | null} Core Library type name, or null when not a Core Library Init call
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
 * @param {import('eslint').Rule.Node} node - AST node to inspect
 * @returns {boolean} true when the node is a WSProxy constructor call
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
