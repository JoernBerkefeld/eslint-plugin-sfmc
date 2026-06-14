/**
 * Rule: ssjs-no-property-call
 *
 * Flags Platform.Request and Platform.Response members that are properties,
 * not methods. Calling them with `()` is a runtime error.
 *
 * Three cases are handled:
 *
 *   1. Read with parens (both namespaces, no args):
 *        Platform.Request.Method()  →  Platform.Request.Method
 *
 *   2. Write via function call (Platform.Response.* only, single arg):
 *        Platform.Response.ContentType("text/html")
 *        →  Platform.Response.ContentType = "text/html"
 *
 *   3. Attempt to set a read-only property (Platform.Request.*, with args):
 *        Platform.Request.Method("POST")  →  no auto-fix (read-only)
 */

import { PLATFORM_RESPONSE_METHODS, PLATFORM_REQUEST_METHODS } from 'ssjs-data';

const RESPONSE_PROPERTIES = new Set(
    PLATFORM_RESPONSE_METHODS.filter((m) => m.isProperty).map((m) => m.name.toLowerCase()),
);

const REQUEST_PROPERTIES = new Set(
    PLATFORM_REQUEST_METHODS.filter((m) => m.isProperty).map((m) => m.name.toLowerCase()),
);

/**
 * Returns true when replacing a call with an assignment expression is syntactically safe.
 *
 * @param {import('eslint').Rule.Node} node - CallExpression node
 * @returns {boolean} Whether assignment replacement is valid in this parent context
 */
function canReplaceCallWithAssignment(node) {
    const parent = node.parent;
    if (parent.type === 'ExpressionStatement' && parent.expression === node) {
        return true;
    }
    if (parent.type === 'SequenceExpression' && parent.expressions.includes(node)) {
        return true;
    }
    return false;
}

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description: 'Disallow calling Platform.Request/Response properties as functions',
        },
        messages: {
            propertyReadWithCall:
                "'Platform.{{ns}}.{{name}}' is a property, not a function. " +
                "Remove the '()' to read its value.",
            readOnlyPropertySet:
                "'Platform.Request.{{name}}' is a read-only property. It cannot be assigned a value.",
            writablePropertySet:
                "'Platform.Response.{{name}}' is a property. " +
                'Use `Platform.Response.{{name}} = value` to assign instead of calling it as a function.',
        },
        schema: [],
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            CallExpression(node) {
                const callee = node.callee;

                if (
                    callee.type !== 'MemberExpression' ||
                    callee.object.type !== 'MemberExpression' ||
                    callee.object.object.type !== 'Identifier' ||
                    callee.object.object.name !== 'Platform' ||
                    callee.object.property.type !== 'Identifier' ||
                    callee.property.type !== 'Identifier'
                ) {
                    return;
                }

                const ns = callee.object.property.name.toLowerCase();
                const propName = callee.property.name.toLowerCase();
                const displayNs = callee.object.property.name;
                const displayName = callee.property.name;

                if (ns === 'response' && RESPONSE_PROPERTIES.has(propName)) {
                    if (node.arguments.length === 0) {
                        context.report({
                            node,
                            messageId: 'propertyReadWithCall',
                            data: { ns: displayNs, name: displayName },
                            fix(fixer) {
                                return fixer.replaceText(node, sourceCode.getText(callee));
                            },
                        });
                    } else if (node.arguments.length === 1) {
                        context.report({
                            node,
                            messageId: 'writablePropertySet',
                            data: { ns: displayNs, name: displayName },
                            fix(fixer) {
                                if (!canReplaceCallWithAssignment(node)) {
                                    return null;
                                }
                                const argText = sourceCode.getText(node.arguments[0]);
                                return fixer.replaceText(
                                    node,
                                    `${sourceCode.getText(callee)} = ${argText}`,
                                );
                            },
                        });
                    } else {
                        context.report({
                            node,
                            messageId: 'writablePropertySet',
                            data: { ns: displayNs, name: displayName },
                        });
                    }
                } else if (ns === 'request' && REQUEST_PROPERTIES.has(propName)) {
                    if (node.arguments.length === 0) {
                        context.report({
                            node,
                            messageId: 'propertyReadWithCall',
                            data: { ns: displayNs, name: displayName },
                            fix(fixer) {
                                return fixer.replaceText(node, sourceCode.getText(callee));
                            },
                        });
                    } else {
                        context.report({
                            node,
                            messageId: 'readOnlyPropertySet',
                            data: { name: displayName },
                        });
                    }
                }
            },
        };
    },
};
