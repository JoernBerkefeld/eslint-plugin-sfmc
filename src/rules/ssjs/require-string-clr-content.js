/**
 * Rule: ssjs-require-string-clr-content
 *
 * The `content` property of an HttpResponse (returned by `req.send()` on a
 * `Script.Util.HttpRequest` or `Script.Util.HttpGet`) is a CLR string object,
 * not a native JavaScript string. Using it directly — passing it to
 * `Platform.Function.ParseJSON()`, calling a string method on it, concatenating
 * it, or assigning it to a variable used as a string — is unreliable in the
 * SFMC SSJS (ES3/CLR) engine.
 *
 * The verified fix is to wrap the value with `String(resp.content)` before any
 * further use, e.g. `Platform.Function.ParseJSON(String(resp.content))`.
 *
 * This rule tracks variables assigned from `req.send()` (where `req` came from a
 * `Script.Util.HttpRequest`/`HttpGet`) and flags any read of their `.content`
 * that is not already the direct argument of a `String(...)` call. The quick-fix
 * wraps the access in `String(...)`.
 */

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
 * `new Script.Util.HttpRequest(...)` or `Script.Util.HttpGet(...)` (the latter
 * is commonly called without `new`).
 *
 * @param {import('eslint').Rule.Node} node - init expression of a declarator
 * @returns {boolean} Whether the expression yields an HTTP request instance
 */
function isHttpRequestInit(node) {
    if (!node) {
        return false;
    }
    if (node.type === 'NewExpression') {
        return isHttpConstructorMember(node.callee);
    }
    if (node.type === 'CallExpression') {
        return isHttpConstructorMember(node.callee);
    }
    return false;
}

/**
 * Returns true when the `.content` member is already the direct single argument
 * of a `String(...)` call — the verified-safe pattern.
 *
 * @param {import('eslint').Rule.Node} node - the `.content` MemberExpression
 * @returns {boolean} Whether it is wrapped by String(...)
 */
function isWrappedInString(node) {
    const parent = node.parent;
    return Boolean(
        parent &&
        parent.type === 'CallExpression' &&
        parent.callee.type === 'Identifier' &&
        parent.callee.name === 'String' &&
        parent.arguments.length === 1 &&
        parent.arguments[0] === node,
    );
}

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description:
                'Require wrapping HttpResponse.content with String() before use — the raw CLR string is unreliable in the SSJS engine',
        },
        messages: {
            clrContentAccess:
                'Reading `{{ text }}` directly is unreliable — `content` is a CLR string, not a JavaScript string. ' +
                'Wrap it with `String({{ text }})` before passing it to ParseJSON() or any string operation.',
        },
        schema: [],
    },

    create(context) {
        const sourceCode = context.sourceCode;

        // Variable names that hold an HttpRequest/HttpGet instance.
        const requestVariables = new Set();
        // Variable names that hold the response of `<requestVar>.send()`.
        const responseVariables = new Set();
        // Deferred reports so name collection completes before we decide.
        const pending = [];

        /**
         * Returns true when `node` is a `<requestVar>.send()` call.
         *
         * @param {import('eslint').Rule.Node} node - init expression
         * @returns {boolean} Whether it is a tracked request's send() call
         */
        function isTrackedSendCall(node) {
            return Boolean(
                node &&
                node.type === 'CallExpression' &&
                node.callee.type === 'MemberExpression' &&
                node.callee.property.type === 'Identifier' &&
                node.callee.property.name === 'send' &&
                node.callee.object.type === 'Identifier' &&
                requestVariables.has(node.callee.object.name),
            );
        }

        /**
         * Returns true when `node` is a `<responseVar>.content` member read on a
         * tracked response variable.
         *
         * @param {import('eslint').Rule.Node} node - MemberExpression to test
         * @returns {boolean} Whether it reads .content on a tracked response var
         */
        function isTrackedContentMember(node) {
            return (
                node.type === 'MemberExpression' &&
                !node.computed &&
                node.property.type === 'Identifier' &&
                node.property.name === 'content' &&
                node.object.type === 'Identifier' &&
                responseVariables.has(node.object.name)
            );
        }

        return {
            VariableDeclarator(node) {
                if (node.id.type !== 'Identifier') {
                    return;
                }
                if (isHttpRequestInit(node.init)) {
                    requestVariables.add(node.id.name);
                } else if (isTrackedSendCall(node.init)) {
                    responseVariables.add(node.id.name);
                }
            },

            // resp.content — non-computed member read on a tracked response var.
            'MemberExpression[computed=false]'(node) {
                if (!isTrackedContentMember(node)) {
                    return;
                }
                if (isWrappedInString(node)) {
                    return;
                }
                pending.push(node);
            },

            'Program:exit'() {
                for (const node of pending) {
                    const text = sourceCode.getText(node);
                    context.report({
                        node,
                        messageId: 'clrContentAccess',
                        data: { text },
                        fix(fixer) {
                            return fixer.replaceText(node, `String(${text})`);
                        },
                    });
                }
            },
        };
    },
};
