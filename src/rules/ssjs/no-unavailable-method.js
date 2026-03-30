/**
 * Rule: no-unavailable-method
 *
 * Flags calls to Array methods that are either missing or broken in SFMC's
 * legacy ECMAScript engine (Jint/ECMAScript 3) and suggests inserting a
 * polyfill at the end of the file.
 *
 * - category 'unavailable': method does not exist; calling it throws a runtime error.
 * - category 'broken': method exists natively but returns incorrect results.
 *
 * No auto-fix is applied because prototype assignments are not hoisted —
 * the suggestion inserts the polyfill at the end of the file, and users
 * should verify placement before the first call (or load via Content Block).
 */

import { polyfillByPrototypeName, polyfillByStaticName } from 'ssjs-data';

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
                'Flag Array methods unavailable or broken in SFMC SSJS and suggest polyfills',
        },
        messages: {
            unavailable:
                "'{{owner}}.{{method}}' is not available in SFMC SSJS (ECMAScript 3). " +
                'Add a polyfill before using it.',
            broken:
                "'{{owner}}.{{method}}' exists in SFMC SSJS but produces incorrect results. " +
                'Add a polyfill to get the correct behavior.',
            addPolyfill: "Insert '{{owner}}.{{method}}' polyfill at end of file",
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
                const src = context.sourceCode;
                const end = src.ast.range[1];
                return fixer.insertTextAfterRange([end, end], '\n\n' + entry.polyfill);
            };
        }

        return {
            // Detect polyfill assignments already present in the file:
            // Array.prototype.map = ...  /  Array.isArray = ...  /  String.prototype.trim = ...
            AssignmentExpression(node) {
                const left = node.left;
                if (left.type !== 'MemberExpression') return;

                const obj = left.object;
                const prop = left.property;
                if (prop.type !== 'Identifier') return;

                // Array.X = ...
                if (obj.type === 'Identifier' && obj.name === 'Array') {
                    alreadyPolyfilled.add(prop.name);
                    return;
                }

                // Array.prototype.X = ...  or  String.prototype.X = ...
                if (
                    obj.type === 'MemberExpression' &&
                    obj.object.type === 'Identifier' &&
                    (obj.object.name === 'Array' || obj.object.name === 'String') &&
                    obj.property.type === 'Identifier' &&
                    obj.property.name === 'prototype'
                ) {
                    alreadyPolyfilled.add(prop.name);
                }
            },

            CallExpression(node) {
                const callee = node.callee;
                if (callee.type !== 'MemberExpression') return;

                const prop = callee.property;
                if (prop.type !== 'Identifier') return;

                const methodName = prop.name;
                const receiver = callee.object;

                // ── Static Array methods: Array.isArray(), Array.of() ──────────
                if (
                    receiver.type === 'Identifier' &&
                    receiver.name === 'Array' &&
                    polyfillByStaticName.has(methodName)
                ) {
                    if (ignored.has(methodName)) return;
                    const entry = polyfillByStaticName.get(methodName);
                    pendingReports.push({ node: prop, entry });
                    return;
                }

                // ── Prototype methods ─────────────────────────────────────────
                if (!polyfillByPrototypeName.has(methodName)) return;
                if (ignored.has(methodName)) return;

                const entry = polyfillByPrototypeName.get(methodName);

                // Skip known SFMC top-level objects to avoid false positives.
                if (receiver.type === 'Identifier' && SFMC_RECEIVERS.has(receiver.name)) return;

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
                    if (!isDefinitelyArray) return;
                }

                pendingReports.push({ node: prop, entry });
            },

            'Program:exit'() {
                for (const { node, entry } of pendingReports) {
                    if (isAlreadyPolyfilled(entry.method)) continue;

                    context.report({
                        node,
                        messageId: entry.category,
                        data: { owner: entry.owner, method: entry.method },
                        suggest: [
                            {
                                messageId: 'addPolyfill',
                                data: { owner: entry.owner, method: entry.method },
                                fix: buildSuggestFix(entry),
                            },
                        ],
                    });
                }
            },
        };
    },
};
