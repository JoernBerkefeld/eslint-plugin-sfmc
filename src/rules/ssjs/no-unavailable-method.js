/**
 * Rule: no-unavailable-method
 *
 * Flags calls to ECMAScript built-in methods that are either missing or broken
 * in SFMC's legacy engine (Jint/ECMAScript 3).
 *
 * Two catalogs from ssjs-data feed this rule:
 *
 * 1. POLYFILLABLE_METHODS — a shipped ES3-safe polyfill exists. The report
 *    carries a suggestion that inserts the polyfill at the end of the file.
 * 2. KNOWN_UNSUPPORTED — no polyfill is feasible. The report has no fix; the
 *    message carries the ssjs-data `suggestion` (e.g. use Platform.Function.X).
 *
 * - category 'unavailable': method does not exist; calling it throws a runtime error.
 * - category 'broken': method exists natively but returns incorrect results.
 *
 * No auto-fix is applied because prototype assignments are not hoisted —
 * the suggestion inserts the polyfill at the end of the file, and users
 * should verify placement before the first call (or load via Content Block).
 */

import {
    polyfillByPrototypeName,
    polyfillByStaticName,
    knownUnsupportedByPrototypeName,
    knownUnsupportedByStaticName,
} from 'ssjs-data';

// SFMC-specific top-level objects whose methods must never be flagged even
// when their method names collide with Array.prototype (e.g. Platform.find).
const SFMC_RECEIVERS = new Set([
    'Platform',
    'HTTP',
    'WSProxy',
    'Variable',
    'Request',
    'Response',
    'Automation',
    'DataExtension',
    'Subscriber',
    'Email',
    'List',
    'Query',
]);

export default {
    meta: {
        type: 'problem',
        hasSuggestions: true,
        docs: {
            description:
                'Flag ECMAScript built-in methods unavailable or broken in SFMC SSJS and suggest polyfills',
        },
        messages: {
            unavailable:
                "'{{owner}}.{{method}}' is not available in SFMC SSJS (ECMAScript 3). " +
                'Add a polyfill before using it.',
            broken:
                "'{{owner}}.{{method}}' exists in SFMC SSJS but produces incorrect results. " +
                'Add a polyfill to get the correct behavior.',
            addPolyfill: "Insert '{{owner}}.{{method}}' polyfill at end of file",
            unavailableNoPolyfill:
                "'{{owner}}.{{method}}' is not available in SFMC SSJS (ECMAScript 3). {{suggestion}}",
            brokenNoPolyfill:
                "'{{owner}}.{{method}}' exists in SFMC SSJS but produces incorrect results. {{suggestion}}",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    ignore: {
                        type: 'array',
                        items: { type: 'string' },
                        uniqueItems: true,
                        description: 'Method names to ignore (e.g. when loaded via Content Block).',
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] || {};
        const ignored = new Set(options.ignore || []);

        // Track which methods already have a polyfill assignment in this file.
        // We detect: Array.prototype.X = function ...  or  Array.X = function ...
        const alreadyPolyfilled = new Set();

        // Defer reports until Program:exit so we can suppress ones that have
        // a polyfill definition earlier in the file.
        const pendingReports = [];

        function isAlreadyPolyfilled(method) {
            return alreadyPolyfilled.has(method);
        }

        function buildSuggestFix(entry) {
            return function fix(fixer) {
                const source = context.sourceCode;
                const end = source.ast.range[1];
                return fixer.insertTextAfterRange([end, end], '\n\n' + entry.polyfill);
            };
        }

        return {
            // Detect polyfill assignments already present in the file:
            // Array.prototype.map = ...  /  Array.isArray = ...  /  String.prototype.trim = ...
            AssignmentExpression(node) {
                const left = node.left;
                if (left.type !== 'MemberExpression') {
                    return;
                }

                const object = left.object;
                const property = left.property;
                if (property.type !== 'Identifier') {
                    return;
                }

                // Array.X = ...
                if (object.type === 'Identifier' && object.name === 'Array') {
                    alreadyPolyfilled.add(property.name);
                    return;
                }

                // Array.prototype.X = ...  or  String.prototype.X = ...
                if (
                    object.type === 'MemberExpression' &&
                    object.object.type === 'Identifier' &&
                    (object.object.name === 'Array' || object.object.name === 'String') &&
                    object.property.type === 'Identifier' &&
                    object.property.name === 'prototype'
                ) {
                    alreadyPolyfilled.add(property.name);
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
                const receiver = callee.object;

                const lowerMethod = methodName.toLowerCase();

                // ── Static methods with a polyfill: Array.isArray(), Array.of() ─
                if (
                    receiver.type === 'Identifier' &&
                    receiver.name === 'Array' &&
                    polyfillByStaticName.has(methodName)
                ) {
                    if (ignored.has(methodName)) {
                        return;
                    }
                    const entry = polyfillByStaticName.get(methodName);
                    pendingReports.push({ node: property, entry });
                    return;
                }

                // ── Static methods with NO polyfill: JSON.parse, Object.keys, … ─
                // The owner prefix is explicit, so match owner.member precisely.
                if (
                    receiver.type === 'Identifier' &&
                    knownUnsupportedByStaticName.has(lowerMethod)
                ) {
                    const entry = knownUnsupportedByStaticName.get(lowerMethod);
                    const ownerBase = entry.owner.replace(/\.prototype$/, '');
                    if (receiver.name === ownerBase && !ignored.has(methodName)) {
                        pendingReports.push({ node: property, entry, noPolyfill: true });
                        return;
                    }
                }

                // ── Prototype methods with a polyfill ──────────────────────────
                if (polyfillByPrototypeName.has(methodName)) {
                    if (ignored.has(methodName)) {
                        return;
                    }

                    // Skip known SFMC top-level objects to avoid false positives.
                    if (receiver.type === 'Identifier' && SFMC_RECEIVERS.has(receiver.name)) {
                        return;
                    }

                    const entry = polyfillByPrototypeName.get(methodName);

                    // For methods that also exist on String.prototype in ES3
                    // (indexOf, lastIndexOf), only flag when the receiver is
                    // a literal array or the call is chained from an array method
                    // we already know about — otherwise we'd falsely flag string usage.
                    if (entry.ambiguousWithString) {
                        const isDefinitelyArray =
                            receiver.type === 'ArrayExpression' ||
                            // arr.filter(...).indexOf(...) — left side is a CallExpression
                            // whose callee refers to another Array method
                            (receiver.type === 'CallExpression' &&
                                receiver.callee.type === 'MemberExpression' &&
                                polyfillByPrototypeName.has(receiver.callee.property.name));
                        if (!isDefinitelyArray) {
                            return;
                        }
                    }

                    pendingReports.push({ node: property, entry });
                    return;
                }

                // ── Prototype methods with NO polyfill: .trimStart(), .flat(), … ─
                if (knownUnsupportedByPrototypeName.has(lowerMethod)) {
                    if (ignored.has(methodName)) {
                        return;
                    }
                    // Skip known SFMC top-level objects to avoid false positives.
                    if (receiver.type === 'Identifier' && SFMC_RECEIVERS.has(receiver.name)) {
                        return;
                    }
                    const entry = knownUnsupportedByPrototypeName.get(lowerMethod);
                    pendingReports.push({ node: property, entry, noPolyfill: true });
                }
            },

            'Program:exit'() {
                for (const { node, entry, noPolyfill } of pendingReports) {
                    // KNOWN_UNSUPPORTED entries use `member`; polyfillable use `method`.
                    const methodName = entry.method ?? entry.member;
                    const ownerDisplay = entry.owner.replace(/\.prototype$/, '');

                    if (noPolyfill) {
                        // No polyfill is feasible — report with the ssjs-data suggestion
                        // and no auto-insert fix.
                        context.report({
                            node,
                            messageId:
                                entry.category === 'broken'
                                    ? 'brokenNoPolyfill'
                                    : 'unavailableNoPolyfill',
                            data: {
                                owner: ownerDisplay,
                                method: methodName,
                                suggestion: entry.suggestion,
                            },
                        });
                        continue;
                    }

                    if (isAlreadyPolyfilled(methodName)) {
                        continue;
                    }

                    context.report({
                        node,
                        messageId: entry.category,
                        data: { owner: entry.owner, method: methodName },
                        suggest: [
                            {
                                messageId: 'addPolyfill',
                                data: { owner: entry.owner, method: methodName },
                                fix: buildSuggestFix(entry),
                            },
                        ],
                    });
                }
            },
        };
    },
};
