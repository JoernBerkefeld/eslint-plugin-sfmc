/**
 * Rule: ssjs-no-deprecated-function
 *
 * Flags use of deprecated SFMC SSJS APIs. Currently covers:
 *
 *   - ContentArea(...)             — bare alias (use Platform.Function.ContentAreaByName instead)
 *   - ContentAreaByName(...)       — bare alias (use Platform.Function.ContentAreaByName instead)
 *   - Platform.Function.ContentArea(...)
 *   - Platform.Function.ContentAreaByName(...)
 *   - Any Core Library class flagged `deprecated` in ssjs-data's coreDeprecatedMethodLookup
 *     (currently ContentAreaObj, Email, Portfolio, Template, Send, Send.Definition) —
 *     both static (`Portfolio.Retrieve(...)`) and instance
 *     (`var p = Portfolio.Init(...); p.Update(...)`) call styles, including
 *     multi-part static/instance paths (`Send.Definition.Add(...)`).
 *   - ErrorUtil.ThrowWSProxyError(...) — deprecated; only exists under Platform.Load("Core", "1")
 */

import {
    platformFunctionLookup,
    SSJS_GLOBALS,
    coreObjectNames,
    coreDeprecatedMethodLookup,
    ERROR_UTIL_METHODS,
} from 'ssjs-data';

// Lookup Map: lowercase name → entry, for SSJS_GLOBALS entries that are deprecated.
// Used to flag bare calls like ContentArea(...) and ContentAreaByName(...).
const DEPRECATED_GLOBALS = new Map(
    SSJS_GLOBALS.filter((g) => g.deprecated).map((g) => [g.name.toLowerCase(), g]),
);

// Deprecated ErrorUtil methods (e.g. ThrowWSProxyError). Used to flag calls like
// ErrorUtil.ThrowWSProxyError(result), which only exists under Platform.Load("Core", "1").
// ErrorUtil is not part of ssjs-data's coreObjectNames / coreDeprecatedMethodLookup (it has
// no Init-based instance form), so it is handled as its own special case.
const ERRORUTIL_DEPRECATED = new Set(
    ERROR_UTIL_METHODS.filter((m) => m.deprecated).map((m) => m.name.toLowerCase()),
);

/**
 * Look up a deprecated method entry for a Core Library class.
 *
 * @param {string} className - Core Library class name (e.g. "Portfolio", "Send.Definition")
 * @param {string} methodName - method name (e.g. "Retrieve")
 * @returns {object|null} the ssjs-data method entry, or null when not deprecated
 */
function findDeprecatedEntry(className, methodName) {
    const classLookup = coreDeprecatedMethodLookup.get(className.toLowerCase());
    if (!classLookup) {
        return null;
    }
    return classLookup.get(methodName.toLowerCase()) || null;
}

/**
 * Build a dotted member path string from a MemberExpression / Identifier chain.
 *
 * @param {object} node - the object node
 * @returns {string|null} The dotted path, or null when the chain contains
 * anything other than plain identifiers/member accesses.
 */
function getMemberPath(node) {
    if (node.type === 'Identifier') {
        return node.name;
    }
    if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
        const object = getMemberPath(node.object);
        return object ? `${object}.${node.property.name}` : null;
    }
    return null;
}

/**
 * Resolve the Core Library class name for a `Class.Init(...)` /
 * `A.B.Init(...)` call expression, e.g. `Portfolio.Init(...)` or
 * `Send.Definition.Init(...)`.
 *
 * @param {object} node - the init expression node
 * @returns {string|null} The resolved core class name, or null
 */
function getCoreInitType(node) {
    if (!node || node.type !== 'CallExpression') {
        return null;
    }
    const callee = node.callee;
    if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') {
        return null;
    }
    if (callee.property.name !== 'Init') {
        return null;
    }
    const objectPath = getMemberPath(callee.object);
    return objectPath && coreObjectNames.has(objectPath) ? objectPath : null;
}

/**
 * Extract the trailing "Deprecated — ..." sentence from a deprecated
 * method's `description` so the message surfaces each class's specific
 * reasoning (falls back to a generic note when none is present).
 *
 * @param {object} entry - ssjs-data method entry
 * @returns {string} The deprecation sentence
 */
function deprecationNote(entry) {
    const match = /deprecated\s*—\s*(.+)$/i.exec(entry.description || '');
    return match ? `Deprecated — ${match[1]}` : 'This API is deprecated.';
}

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
            deprecatedCoreStatic: "'{{name}}' is deprecated. {{note}}",
            deprecatedCoreInstance:
                "'{{method}}' called on a {{className}} variable is deprecated. {{note}}",
            deprecatedErrorUtil:
                "'ErrorUtil.{{name}}' is deprecated — it only exists under Platform.Load(\"Core\", \"1\") and is undefined in newer Core versions. Check 'result.Status' and 'throw new Error(...)' instead.",
        },
        schema: [],
    },

    create(context) {
        // Track variable names assigned via <CoreClass>.Init(...) → resolved class name,
        // e.g. `var p = Portfolio.Init(...)` → coreVariables.set('p', 'Portfolio').
        const coreVariables = new Map();

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

                if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') {
                    return;
                }

                const property = callee.property;
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

                const objectPath = getMemberPath(callee.object);
                if (!objectPath) {
                    return;
                }

                // ── Static call: Portfolio.Retrieve(…) / Send.Definition.Add(…) ──
                // Exclude Init — that call is already implicitly covered when we
                // track the returned instance and flag its instance methods.
                // Reporting it here as well would produce a duplicate error on
                // the same statement (e.g. `var p = Portfolio.Init(...)`).
                if (coreObjectNames.has(objectPath) && methodName.toLowerCase() !== 'init') {
                    const entry = findDeprecatedEntry(objectPath, methodName);
                    // A static-style call (`Class.Method(...)`) only matches a method
                    // that is actually callable that way — an entry explicitly flagged
                    // `isStatic: false` exists only on the instance, so it is not a
                    // "known" deprecated call in this form.
                    if (entry && entry.isStatic !== false) {
                        context.report({
                            node: property,
                            messageId: 'deprecatedCoreStatic',
                            data: {
                                name: `${objectPath}.${methodName}`,
                                note: deprecationNote(entry),
                            },
                        });
                    }
                    return;
                }

                // ── Instance call: <var>.Update(…) / <var>.SubPath.Method(…) where
                // `var` was assigned from a tracked <CoreClass>.Init(...) call ────
                const segments = objectPath.split('.');
                const rootCoreType = coreVariables.get(segments[0]);
                if (!rootCoreType) {
                    return;
                }
                const resolvedClass = [rootCoreType, ...segments.slice(1)].join('.');
                const entry = findDeprecatedEntry(resolvedClass, methodName);
                // An instance-style call (`<var>.Method(...)`) only matches a method
                // explicitly flagged `isStatic: false` — a static-only method (e.g.
                // `Send.RetrieveLists`) does not exist on the instance, so it is not
                // a "known" deprecated call in this form (it should surface as an
                // unknown-member problem elsewhere, not a misleading deprecation).
                if (entry && entry.isStatic === false) {
                    context.report({
                        node: property,
                        messageId: 'deprecatedCoreInstance',
                        data: {
                            method: methodName,
                            className: resolvedClass,
                            note: deprecationNote(entry),
                        },
                    });
                }
            },
        };
    },
};
