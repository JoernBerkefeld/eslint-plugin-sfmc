/**
 * Rule: ssjs-no-deprecated-function
 *
 * Flags use of deprecated SFMC SSJS APIs. Currently covers:
 *
 *   - ContentArea(...)             — bare alias (use Platform.Function.ContentAreaByName instead)
 *   - ContentAreaByName(...)       — bare alias (use Platform.Function.ContentAreaByName instead)
 *   - Platform.Function.ContentArea(...)
 *   - Platform.Function.ContentAreaByName(...)
 *   - ContentAreaObj.Init(...)     — static method (class is deprecated)
 *   - ContentAreaObj.Add(...)      — static method
 *   - ContentAreaObj.Retrieve(...) — static method
 *   - <contentAreaObjVar>.Update(...) — instance method on a tracked ContentAreaObj variable
 *   - <contentAreaObjVar>.Remove()    — instance method on a tracked ContentAreaObj variable
 *   - ErrorUtil.ThrowWSProxyError(...) — deprecated; only exists under Platform.Load("Core", "1")
 */

import {
    platformFunctionLookup,
    SSJS_GLOBALS,
    CONTENT_AREA_OBJ_METHODS,
    ERROR_UTIL_METHODS,
} from 'ssjs-data';

// Lookup Map: lowercase name → entry, for SSJS_GLOBALS entries that are deprecated.
// Used to flag bare calls like ContentArea(...) and ContentAreaByName(...).
const DEPRECATED_GLOBALS = new Map(
    SSJS_GLOBALS.filter((g) => g.deprecated).map((g) => [g.name.toLowerCase(), g]),
);

// Build sets of deprecated static and instance methods from ssjs-data.
// Exclude 'Init' — that call is already implicitly covered when we track the
// returned instance and flag its instance methods. Reporting it here as well
// would produce a duplicate error on the same statement.
const CONTENT_AREA_STATIC_DEPRECATED = new Set(
    CONTENT_AREA_OBJ_METHODS.filter(
        (m) => m.deprecated && m.isStatic && m.name.toLowerCase() !== 'init',
    ).map((m) => m.name.toLowerCase()),
);

const CONTENT_AREA_INSTANCE_DEPRECATED = new Set(
    CONTENT_AREA_OBJ_METHODS.filter((m) => m.deprecated && !m.isStatic).map((m) =>
        m.name.toLowerCase(),
    ),
);

// Deprecated ErrorUtil methods (e.g. ThrowWSProxyError). Used to flag calls like
// ErrorUtil.ThrowWSProxyError(result), which only exists under Platform.Load("Core", "1").
const ERRORUTIL_DEPRECATED = new Set(
    ERROR_UTIL_METHODS.filter((m) => m.deprecated).map((m) => m.name.toLowerCase()),
);

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow use of deprecated SFMC SSJS APIs',
        },
        messages: {
            deprecatedGlobal: "'{{name}}' is deprecated. {{replacement}}",
            deprecatedPlatformFunction:
                "'Platform.Function.{{name}}' is deprecated. Use a supported alternative.",
            deprecatedCoreStatic:
                "'ContentAreaObj.{{name}}' is deprecated. Content Areas are no longer supported.",
            deprecatedCoreInstance:
                "'{{method}}' called on a ContentAreaObj variable is deprecated. Content Areas are no longer supported.",
            deprecatedErrorUtil:
                "'ErrorUtil.{{name}}' is deprecated — it only exists under Platform.Load(\"Core\", \"1\") and is undefined in newer Core versions. Check 'result.Status' and 'throw new Error(...)' instead.",
        },
        schema: [],
    },

    create(context) {
        // Track variable names assigned via ContentAreaObj.Init()
        const contentAreaVariables = new Set();

        return {
            VariableDeclaration(node) {
                for (const declaration of node.declarations) {
                    if (
                        declaration.init &&
                        declaration.id &&
                        declaration.id.type === 'Identifier' &&
                        isContentAreaObjectInit(declaration.init)
                    ) {
                        contentAreaVariables.add(declaration.id.name);
                    }
                }
            },

            AssignmentExpression(node) {
                if (node.left.type === 'Identifier' && isContentAreaObjectInit(node.right)) {
                    contentAreaVariables.add(node.left.name);
                }
            },

            CallExpression(node) {
                const callee = node.callee;

                // ── Bare globals: ContentArea(…) and ContentAreaByName(…) ──────
                if (callee.type === 'Identifier') {
                    const entry = DEPRECATED_GLOBALS.get(callee.name.toLowerCase());
                    if (entry && entry.deprecated) {
                        const replacement = entry.aliasOf
                            ? `Use '${entry.aliasOf}' instead.`
                            : 'Use a supported alternative.';
                        context.report({
                            node: callee,
                            messageId: 'deprecatedGlobal',
                            data: { name: callee.name, replacement },
                        });
                    }
                    return;
                }

                if (callee.type !== 'MemberExpression') {
                    return;
                }

                const property = callee.property;
                if (property.type !== 'Identifier') {
                    return;
                }

                const methodName = property.name;

                // ── Platform.Function.ContentArea(…) / ContentAreaByName(…) ───
                if (
                    callee.object.type === 'MemberExpression' &&
                    callee.object.object.type === 'Identifier' &&
                    callee.object.object.name === 'Platform' &&
                    callee.object.property.type === 'Identifier' &&
                    callee.object.property.name === 'Function'
                ) {
                    const entry = platformFunctionLookup.get(methodName.toLowerCase());
                    if (entry && entry.deprecated) {
                        context.report({
                            node: property,
                            messageId: 'deprecatedPlatformFunction',
                            data: { name: methodName },
                        });
                    }
                    return;
                }

                // ── ContentAreaObj.Init/Add/Retrieve(…) — static deprecated ───
                if (
                    callee.object.type === 'Identifier' &&
                    callee.object.name === 'ContentAreaObj' &&
                    CONTENT_AREA_STATIC_DEPRECATED.has(methodName.toLowerCase())
                ) {
                    context.report({
                        node: property,
                        messageId: 'deprecatedCoreStatic',
                        data: { name: methodName },
                    });
                    return;
                }

                // ── ErrorUtil.ThrowWSProxyError(…) — deprecated ───────────────
                if (
                    callee.object.type === 'Identifier' &&
                    callee.object.name === 'ErrorUtil' &&
                    ERRORUTIL_DEPRECATED.has(methodName.toLowerCase())
                ) {
                    context.report({
                        node: property,
                        messageId: 'deprecatedErrorUtil',
                        data: { name: methodName },
                    });
                    return;
                }

                // ── <contentAreaVar>.Update/Remove() — instance deprecated ─────
                if (
                    callee.object.type === 'Identifier' &&
                    contentAreaVariables.has(callee.object.name) &&
                    CONTENT_AREA_INSTANCE_DEPRECATED.has(methodName.toLowerCase())
                ) {
                    context.report({
                        node: property,
                        messageId: 'deprecatedCoreInstance',
                        data: { method: methodName },
                    });
                }
            },
        };
    },
};

/**
 * Returns true if `node` is a `ContentAreaObj.Init(…)` call.
 *
 * @param {import('eslint').Rule.Node} node - AST node to inspect
 * @returns {boolean} true when the node is a ContentAreaObj.Init call
 */
function isContentAreaObjectInit(node) {
    if (!node || node.type !== 'CallExpression') {
        return false;
    }
    const callee = node.callee;
    return (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'ContentAreaObj' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'Init'
    );
}
