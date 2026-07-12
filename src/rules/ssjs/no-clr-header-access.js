/**
 * Rule: ssjs-no-clr-header-access
 *
 * The `headers` property of an HttpResponse (returned by `req.send()` on a
 * `Script.Util.HttpRequest` or `Script.Util.HttpGet`) is a CLR object. Reading
 * an individual header via indexing (`resp.headers["Content-Type"]`), a `.Get()`
 * / `.Item()` call, or `String(resp.headers[key])` throws at runtime:
 *
 *     "Use of Common Language Runtime (CLR) is not allowed"
 *
 * The only reliable way to read header values is to enumerate `resp.headers`
 * with a `for..in` loop — each key is shaped `"[Name, Value]"`, so the value is
 * embedded in the key string. The `getHeaderMap()` helper parses those keys into
 * a plain `{ name: value }` map.
 *
 * This rule tracks variables assigned from `req.send()` (where `req` came from a
 * `Script.Util.HttpRequest`/`HttpGet`) and flags CLR-style reads of their
 * `.headers`. It offers a suggestion that inserts the `getHeaderMap()` helper
 * and rewrites the access to `getHeaderMap(resp)["name"]`.
 */

/** Canonical helper inserted by the quick-fix, mirrored from ssjs.guide. */
const HEADER_MAP_HELPER = `/**
 * Build a plain { name: value } header map from an HttpResponse.
 * Reads only the for..in enumeration keys (shaped "[Name, Value]") so it never
 * touches a CLR value — avoiding "Use of Common Language Runtime (CLR) is not allowed".
 * @param {object} resp - the response returned by req.send()
 * @returns {object} map of lowercased header name => value string
 */
function getHeaderMap(resp) {
    var map = {};
    for (var k in resp.headers) {
        var pair = String(k);
        if (pair.charAt(0) === "[") { pair = pair.substring(1); }
        if (pair.charAt(pair.length - 1) === "]") { pair = pair.substring(0, pair.length - 1); }
        var idx = pair.indexOf(", ");
        if (idx > -1) {
            map[pair.substring(0, idx).toLowerCase()] = pair.substring(idx + 2);
        }
    }
    return map;
}
`;

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

export default {
    meta: {
        type: 'problem',
        hasSuggestions: true,
        docs: {
            description:
                'Disallow CLR-unsafe reads of HttpResponse.headers (indexing, .Get(), .Item(), String()) — read headers via a for..in map instead',
        },
        messages: {
            clrHeaderAccess:
                'Reading `{{ text }}` throws "Use of Common Language Runtime (CLR) is not allowed" at runtime. ' +
                'HttpResponse headers are only readable by enumerating with for..in — use a getHeaderMap() helper.',
            insertHelperAndRewrite:
                'Insert getHeaderMap() helper and read via getHeaderMap({{ respName }})[…]',
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
         * Returns the response variable name for a `<obj>.headers` member
         * expression when `<obj>` is a tracked response variable, else null.
         *
         * @param {import('eslint').Rule.Node} headersMember - the `.headers` MemberExpression
         * @returns {string|null} Response variable name or null
         */
        function trackedResponseName(headersMember) {
            if (
                headersMember.type === 'MemberExpression' &&
                headersMember.property.type === 'Identifier' &&
                headersMember.property.name === 'headers' &&
                headersMember.object.type === 'Identifier' &&
                responseVariables.has(headersMember.object.name)
            ) {
                return headersMember.object.name;
            }
            return null;
        }

        /**
         * Builds the suggestion descriptor: insert the helper at the top of the
         * program (once) and rewrite the flagged access to use getHeaderMap().
         *
         * @param {import('eslint').Rule.Node} reportNode - node covered by the diagnostic
         * @param {import('eslint').Rule.Node} keyNode - the header-key expression
         * @param {string} respName - tracked response variable name
         * @returns {object} ESLint suggestion object
         */
        function buildSuggestion(reportNode, keyNode, respName) {
            const keyText = keyNode ? sourceCode.getText(keyNode) : '';
            return {
                messageId: 'insertHelperAndRewrite',
                data: { respName },
                fix(fixer) {
                    const fixes = [
                        fixer.replaceText(reportNode, `getHeaderMap(${respName})[${keyText}]`),
                    ];
                    // Insert the helper once, at the very top of the program.
                    if (!sourceCode.getText().includes('function getHeaderMap(')) {
                        const program = sourceCode.ast;
                        fixes.push(fixer.insertTextBefore(program, `${HEADER_MAP_HELPER}\n`));
                    }
                    return fixes;
                },
            };
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

            // resp.headers["Content-Type"]  — computed index read.
            'MemberExpression[computed=true]'(node) {
                const respName = trackedResponseName(node.object);
                if (!respName) {
                    return;
                }
                pending.push({
                    reportNode: node,
                    keyNode: node.property,
                    respName,
                });
            },

            // resp.headers.Get(...) / resp.headers.Item(...) — CLR method call.
            'CallExpression > MemberExpression.callee'(node) {
                if (
                    node.property.type !== 'Identifier' ||
                    (node.property.name !== 'Get' && node.property.name !== 'Item')
                ) {
                    return;
                }
                const respName = trackedResponseName(node.object);
                if (!respName) {
                    return;
                }
                const call = node.parent;
                pending.push({
                    reportNode: call,
                    keyNode: call.arguments.length > 0 ? call.arguments[0] : null,
                    respName,
                });
            },

            'Program:exit'() {
                for (const { reportNode, keyNode, respName } of pending) {
                    context.report({
                        node: reportNode,
                        messageId: 'clrHeaderAccess',
                        data: { text: sourceCode.getText(reportNode) },
                        suggest: [buildSuggestion(reportNode, keyNode, respName)],
                    });
                }
            },
        };
    },
};
