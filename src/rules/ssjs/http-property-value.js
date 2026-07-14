/**
 * Rule: ssjs-http-property-value
 *
 * Flags literal assignments to writable `Script.Util.HttpRequest` /
 * `Script.Util.HttpGet` instance properties whose value violates the property's
 * documented, runtime-confirmed constraint (allowed enum, integer-ness, or
 * minimum). Examples that throw or misbehave at runtime:
 *
 *     req.emptyContentHandling = 5;   // allowed: 0 | 1 | 2
 *     req.retries = -2.45;            // must be a non-negative integer
 *     req.method = 'POT';             // allowed: GET | POST | PUT | PATCH | DELETE
 *
 * Constraints live in ssjs-data (`SCRIPT_UTIL_REQUEST_PROPERTIES` /
 * `SCRIPT_UTIL_HTTPGET_PROPERTIES` -> `valueConstraint`) so the LSP diagnostic
 * (`ssjs/invalid-http-property-value`) and this rule share one source of truth.
 * Only **literal** right-hand sides are checked; variables / expressions cannot
 * be statically verified and are left alone to avoid false positives.
 */

import { SCRIPT_UTIL_REQUEST_PROPERTIES, SCRIPT_UTIL_HTTPGET_PROPERTIES } from 'ssjs-data';

/**
 * Map of property name => valueConstraint, built once from ssjs-data. When both
 * request and get define the same property, the constraints are identical.
 *
 * @returns {Map<string, object>} property name -> valueConstraint
 */
function buildConstraintLookup() {
    const lookup = new Map();
    for (const property of [...SCRIPT_UTIL_REQUEST_PROPERTIES, ...SCRIPT_UTIL_HTTPGET_PROPERTIES]) {
        if (property && property.valueConstraint && !lookup.has(property.name)) {
            lookup.set(property.name, property.valueConstraint);
        }
    }
    return lookup;
}

const constraintLookup = buildConstraintLookup();

/**
 * Returns true when the node is `Script.Util.HttpRequest` or
 * `Script.Util.HttpGet` (a MemberExpression, optionally the callee of `new`).
 *
 * @param {import('eslint').Rule.Node} node - MemberExpression to test
 * @returns {boolean} Whether it references a Script.Util HTTP constructor
 */
function isHttpConstructorMember(node) {
    return (
        node.type === 'MemberExpression' &&
        node.property.type === 'Identifier' &&
        (node.property.name === 'HttpRequest' || node.property.name === 'HttpGet') &&
        node.object.type === 'MemberExpression' &&
        node.object.property.type === 'Identifier' &&
        node.object.property.name === 'Util' &&
        node.object.object.type === 'Identifier' &&
        node.object.object.name === 'Script'
    );
}

/**
 * Returns true when the node constructs a Script.Util HTTP request, i.e.
 * `new Script.Util.HttpRequest(...)` or `Script.Util.HttpGet(...)`.
 *
 * @param {import('eslint').Rule.Node} node - init expression of a declarator
 * @returns {boolean} Whether the expression yields an HTTP request instance
 */
function isHttpRequestInit(node) {
    if (!node) {
        return false;
    }
    if (node.type === 'NewExpression' || node.type === 'CallExpression') {
        return isHttpConstructorMember(node.callee);
    }
    return false;
}

/**
 * Extracts the literal value from a RHS node, or null when it is not a plain
 * literal (string / number / boolean, incl. a negative numeric like `-2.45`).
 *
 * @param {import('eslint').Rule.Node} node - the assignment right-hand side
 * @returns {{value: string|number|boolean}|null} parsed value wrapper or null
 */
function parseLiteral(node) {
    if (node.type === 'Literal' && typeof node.value !== 'object' && node.value !== null) {
        return { value: node.value };
    }
    // Unary minus / plus on a numeric literal, e.g. -2.45.
    if (
        node.type === 'UnaryExpression' &&
        (node.operator === '-' || node.operator === '+') &&
        node.argument.type === 'Literal' &&
        typeof node.argument.value === 'number'
    ) {
        const n = node.operator === '-' ? -node.argument.value : node.argument.value;
        return { value: n };
    }
    return null;
}

/**
 * Validates a value against a constraint. Returns a human-readable violation
 * fragment (e.g. `must be one of "GET", "POST"`) or null when the value is ok.
 *
 * @param {string|number|boolean} value - the parsed literal value
 * @param {object} constraint - the valueConstraint from ssjs-data
 * @returns {string|null} violation description or null when valid
 */
function checkConstraint(value, constraint) {
    if (Array.isArray(constraint.enum)) {
        if (!constraint.enum.includes(value)) {
            const allowed = constraint.enum
                .map((v) => (typeof v === 'string' ? `"${v}"` : String(v)))
                .join(', ');
            return `must be one of ${allowed}`;
        }
        return null;
    }
    if (constraint.numeric) {
        if (typeof value !== 'number') {
            return 'must be a number';
        }
        if (constraint.numeric === 'integer' && !Number.isSafeInteger(value)) {
            return 'must be an integer';
        }
        if (typeof constraint.min === 'number' && value < constraint.min) {
            return `must be >= ${constraint.min}`;
        }
        return null;
    }
    return null;
}

/**
 * Builds source-ready replacement suggestions for a violation. Enum -> each
 * allowed value (quoted for strings) with its optional `enumLabels` meaning.
 * Numeric -> nothing (no single fix).
 *
 * @param {object} constraint - the valueConstraint from ssjs-data
 * @returns {{code: string, label?: string}[]} replacement snippets to offer as suggestions
 */
function buildSuggestions(constraint) {
    if (Array.isArray(constraint.enum)) {
        const labels = constraint.enumLabels;
        return constraint.enum.map((v) => ({
            code: typeof v === 'string' ? `'${v}'` : String(v),
            label: labels ? labels[String(v)] : undefined,
        }));
    }
    return [];
}

export default {
    meta: {
        type: 'problem',
        hasSuggestions: true,
        docs: {
            description:
                'Disallow invalid literal values assigned to Script.Util.HttpRequest/HttpGet properties (e.g. method, emptyContentHandling, retries) based on their documented allowed values',
        },
        messages: {
            invalidValue: 'Invalid value for {{ prop }}: it {{ violation }}.',
            replaceWith: 'Replace with {{ value }}',
            replaceWithLabel: 'Replace with {{ value }} ({{ label }})',
        },
        schema: [],
    },

    create(context) {
        const requestVariables = new Set();
        const pending = [];

        return {
            VariableDeclarator(node) {
                if (node.id.type === 'Identifier' && isHttpRequestInit(node.init)) {
                    requestVariables.add(node.id.name);
                }
            },

            AssignmentExpression(node) {
                if (
                    node.operator !== '=' ||
                    node.left.type !== 'MemberExpression' ||
                    node.left.computed ||
                    node.left.object.type !== 'Identifier' ||
                    !requestVariables.has(node.left.object.name) ||
                    node.left.property.type !== 'Identifier'
                ) {
                    return;
                }
                const propertyName = node.left.property.name;
                const constraint = constraintLookup.get(propertyName);
                if (!constraint) {
                    return;
                }
                const parsed = parseLiteral(node.right);
                if (!parsed) {
                    return;
                }
                const violation = checkConstraint(parsed.value, constraint);
                if (!violation) {
                    return;
                }
                pending.push({ rhs: node.right, propName: propertyName, violation, constraint });
            },

            'Program:exit'() {
                for (const { rhs, propName, violation, constraint } of pending) {
                    const suggest = buildSuggestions(constraint).map(({ code, label }) =>
                        label
                            ? {
                                  messageId: 'replaceWithLabel',
                                  data: { value: code, label },
                                  fix: (fixer) => fixer.replaceText(rhs, code),
                              }
                            : {
                                  messageId: 'replaceWith',
                                  data: { value: code },
                                  fix: (fixer) => fixer.replaceText(rhs, code),
                              },
                    );
                    context.report({
                        node: rhs,
                        messageId: 'invalidValue',
                        data: { prop: propName, violation },
                        suggest,
                    });
                }
            },
        };
    },
};
