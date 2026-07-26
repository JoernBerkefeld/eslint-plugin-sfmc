/**
 * Rule: ssjs-no-nonfunctional-method
 *
 * Warns when a Core Library method that RESOLVES at runtime but has NO known
 * working invocation (ssjs-data `nonFunctionalAtRuntime`) is called. Unlike a
 * nonexistent member, these methods DO exist (the namespace/instance exposes them
 * as callables), so they remain in completions and the generated `.d.ts` — but
 * every tested call fails, so the call site is flagged.
 *
 * Mirrors the receiver-resolution structure of ssjs-core-method-arity:
 *
 *   var fd = FilterDefinition.Init("x");
 *   fd.Update({...});                  // instance → warn
 *   DataExtension.Rows.Add(rowObj);    // static multi-part
 */

import { coreObjectNames, coreNonFunctionalMethodLookup } from 'ssjs-data';

/**
 * Extract a short factual pointer from an entry's officialDocsNote (first
 * sentence) for the warning message. Returns an empty string when absent.
 *
 * @param {object} entry - ssjs-data method entry
 * @returns {string} A short note, or empty string
 */
function shortNote(entry) {
    if (!entry || typeof entry.officialDocsNote !== 'string') {
        return '';
    }
    const trimmed = entry.officialDocsNote.trim();
    if (trimmed === '') {
        return '';
    }
    const sentenceEnd = trimmed.indexOf('. ');
    return sentenceEnd === -1 ? trimmed : trimmed.slice(0, sentenceEnd + 1);
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Warn when calling a Core Library method that resolves at runtime but has no known working invocation',
        },
        hasSuggestions: false,
        messages: {
            nonFunctional:
                "'{{call}}' exists in SFMC SSJS but has no known working invocation at runtime (every tested call fails). {{note}}",
        },
        schema: [],
    },

    create(context) {
        const coreVariables = new Map(); // varName → className

        // `isInstanceStyle` reflects the call syntax used (`<var>.Method(...)`
        // vs `Class.Method(...)`). An entry only matches when its `isStatic`
        // flag agrees with that call style — a static-only method does not
        // exist on the instance (and vice versa), so it is not a "known"
        // non-functional call in the wrong form.
        function checkNonFunctional(entry, callName, reportNode, isInstanceStyle) {
            if (!entry) {
                return;
            }
            if (isInstanceStyle ? entry.isStatic !== false : entry.isStatic === false) {
                return;
            }
            context.report({
                node: reportNode,
                messageId: 'nonFunctional',
                data: { call: callName, note: shortNote(entry) },
            });
        }

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
                if (callee.type !== 'MemberExpression') {
                    return;
                }
                if (callee.property.type !== 'Identifier') {
                    return;
                }
                const methodName = callee.property.name;

                if (callee.object.type === 'Identifier') {
                    const objectName = callee.object.name;

                    // Core Library instance method: fd.Update(...)
                    const coreType = coreVariables.get(objectName);
                    if (coreType) {
                        const classLookup = coreNonFunctionalMethodLookup.get(
                            coreType.toLowerCase(),
                        );
                        if (classLookup) {
                            const entry = classLookup.get(methodName.toLowerCase());
                            checkNonFunctional(
                                entry,
                                `${coreType}.${methodName}`,
                                callee.property,
                                true,
                            );
                        }
                        return;
                    }

                    // Static single-name: FilterDefinition.Update(...) directly
                    if (coreObjectNames.has(objectName)) {
                        const classLookup = coreNonFunctionalMethodLookup.get(
                            objectName.toLowerCase(),
                        );
                        if (classLookup) {
                            const entry = classLookup.get(methodName.toLowerCase());
                            checkNonFunctional(
                                entry,
                                `${objectName}.${methodName}`,
                                callee.property,
                                false,
                            );
                        }
                        return;
                    }
                }

                // Static multi-part: DataExtension.Rows.Add(...)
                const objectPath = getMemberPath(callee.object);
                if (objectPath && coreObjectNames.has(objectPath)) {
                    const classLookup = coreNonFunctionalMethodLookup.get(objectPath.toLowerCase());
                    if (classLookup) {
                        const entry = classLookup.get(methodName.toLowerCase());
                        checkNonFunctional(
                            entry,
                            `${objectPath}.${methodName}`,
                            callee.property,
                            false,
                        );
                    }
                    return;
                }

                // Instance sub-path: de.Rows.Add(...) where `de` is a tracked
                // Init(...) instance. Substitute the instance's core type for the
                // leftmost identifier and resolve the class key.
                if (objectPath) {
                    const segments = objectPath.split('.');
                    const rootCoreType = coreVariables.get(segments[0]);
                    if (rootCoreType) {
                        const resolvedPath = [rootCoreType, ...segments.slice(1)].join('.');
                        const classLookup = coreNonFunctionalMethodLookup.get(
                            resolvedPath.toLowerCase(),
                        );
                        if (classLookup) {
                            const entry = classLookup.get(methodName.toLowerCase());
                            checkNonFunctional(
                                entry,
                                `${resolvedPath}.${methodName}`,
                                callee.property,
                                true,
                            );
                        }
                    }
                }
            },
        };
    },
};

/**
 * Resolve the Core class name for a `Class.Init(...)` / `A.B.Init(...)` call.
 *
 * @param {object} node - the init expression node
 * @returns {string|null} The resolved core class name, or null
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
 * Build a dotted member path string from a MemberExpression / Identifier.
 *
 * @param {object} node - the object node
 * @returns {string|null} The dotted path, or null
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
