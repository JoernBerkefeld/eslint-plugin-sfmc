/**
 * Rule: ssjs-no-invalid-property-access
 *
 * Flags property accesses that go against the direction the runtime supports.
 * Three distinct runtime behaviours, all driven by the `access` field in
 * ssjs-data (`propertyAccessLookup`) so flagging a future property is a
 * one-field data change:
 *
 *   1. write-only — assignment works, reading THROWS:
 *        req.postData = body;          // fine
 *        Write(req.postData);          // throws "Property Get method was not
 *                                      // found." and aborts the whole page
 *
 *   2. write-only-opaque — assignment works, reading returns an opaque CLR
 *      value instead of the assigned string (no throw):
 *        Platform.Response.ContentType = "application/json";   // fine
 *        var ct = Platform.Response.ContentType;               // opaque value
 *
 *   3. read-only — reading works, assignment is silently ineffective:
 *        var m = Platform.Request.Method;    // fine
 *        Platform.Request.Method = "POST";   // no effect
 *
 * Note `ssjs-no-property-call` already reports the CALL form of a read-only
 * write (`Platform.Request.Method("POST")`). This rule handles the ASSIGNMENT
 * form, which that rule does not see. There is no overlap.
 *
 * Not fixable — the correct fix (keep the value in your own variable) is a
 * refactor, not a mechanical edit.
 */

import { propertyAccessLookup } from 'ssjs-data';

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
 * Resolves the owner namespace of a member expression's object, but only for
 * the shapes this rule tracks: a `Platform.Request` / `Platform.Response`
 * member expression, or an identifier holding a Script.Util HTTP instance.
 *
 * @param {import('eslint').Rule.Node} objectNode - the `object` of the MemberExpression
 * @param {Set.<string>} requestVariables - identifiers holding an HTTP request instance
 * @returns {string|null} Qualified owner name, or null when not tracked
 */
function resolveOwner(objectNode, requestVariables) {
    if (objectNode.type === 'Identifier') {
        return requestVariables.has(objectNode.name) ? 'Script.Util.HttpRequest' : null;
    }
    if (
        objectNode.type === 'MemberExpression' &&
        !objectNode.computed &&
        objectNode.object.type === 'Identifier' &&
        objectNode.object.name === 'Platform' &&
        objectNode.property.type === 'Identifier'
    ) {
        const ns = objectNode.property.name;
        if (ns === 'Request' || ns === 'Response') {
            return `Platform.${ns}`;
        }
    }
    return null;
}

/**
 * Looks up the access restriction for a member expression, or null when the
 * accessed member has no restriction (or is not on a tracked owner).
 *
 * @param {import('eslint').Rule.Node} node - the MemberExpression being accessed
 * @param {Set.<string>} requestVariables - identifiers holding an HTTP request instance
 * @returns {{name: string, owner: string, access: string}|null} the matching entry or null
 */
function lookupAccess(node, requestVariables) {
    if (node.computed || node.property.type !== 'Identifier') {
        return null;
    }
    const owner = resolveOwner(node.object, requestVariables);
    if (!owner) {
        return null;
    }
    return propertyAccessLookup.get(`${owner}.${node.property.name}`.toLowerCase()) ?? null;
}

/**
 * Returns true when the member expression is the target of an assignment
 * (`x.y = …`, including compound assignments such as `x.y += …`).
 *
 * @param {import('eslint').Rule.Node} node - the MemberExpression to test
 * @returns {boolean} Whether the node is an assignment target
 */
function isAssignmentTarget(node) {
    return node.parent.type === 'AssignmentExpression' && node.parent.left === node;
}

const MESSAGE_BY_ACCESS = {
    'write-only': 'writeOnlyRead',
    'write-only-opaque': 'opaqueRead',
};

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow reading write-only SSJS properties (e.g. postData) and assigning to read-only ones (e.g. Platform.Request.Method)',
        },
        messages: {
            writeOnlyRead:
                "'{{owner}}.{{name}}' is write-only. Reading it throws " +
                '"Property Get method was not found." at runtime — outside a try/catch that throw ' +
                'aborts the whole page. Keep the value in your own variable instead.',
            opaqueRead:
                "'{{owner}}.{{name}}' does not read back the value you assigned — the runtime " +
                'returns an opaque CLR value. Keep the value in your own variable instead.',
            readOnlyWrite: "'{{owner}}.{{name}}' is read-only. Assigning to it has no effect.",
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

            MemberExpression(node) {
                const entry = lookupAccess(node, requestVariables);
                if (!entry) {
                    return;
                }
                // Reads of a write-only property: the node must NOT be the
                // left-hand side of an assignment — that direction is allowed.
                // The call form (`Platform.Response.ContentType()`) belongs to
                // `ssjs-no-property-call`, so it is skipped here.
                if (
                    entry.access === 'read-only' ||
                    isAssignmentTarget(node) ||
                    (node.parent.type === 'CallExpression' && node.parent.callee === node)
                ) {
                    return;
                }
                pending.push({ node, entry, messageId: MESSAGE_BY_ACCESS[entry.access] });
            },

            AssignmentExpression(node) {
                if (node.left.type !== 'MemberExpression') {
                    return;
                }
                const entry = lookupAccess(node.left, requestVariables);
                if (!entry || entry.access !== 'read-only') {
                    return;
                }
                pending.push({ node: node.left, entry, messageId: 'readOnlyWrite' });
            },

            'Program:exit'() {
                for (const { node, entry, messageId } of pending) {
                    context.report({
                        node,
                        messageId,
                        data: { owner: entry.owner, name: entry.name },
                    });
                }
            },
        };
    },
};
