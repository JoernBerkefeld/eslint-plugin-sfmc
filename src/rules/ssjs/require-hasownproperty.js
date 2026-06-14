/**
 * Rule: require-hasownproperty
 *
 * In for-in loops, require a hasOwnProperty guard to avoid iterating
 * over inherited properties (like _type) that SSJS objects may have.
 *
 * Auto-fix: wraps the existing loop body in an
 * `if (obj.hasOwnProperty(key)) { ... }` guard.
 */

export default {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description: 'Require hasOwnProperty guard in for-in loops',
        },
        messages: {
            missingGuard:
                'Add a hasOwnProperty check inside for-in loops to avoid iterating over inherited properties.',
        },
        schema: [],
    },

    create(context) {
        return {
            ForInStatement(node) {
                const body = node.body;

                const stmts = body.type === 'BlockStatement' ? body.body : [body];

                if (stmts.length === 0) {
                    return;
                }

                const hasGuard = stmts.some((stmt) => containsHasOwnProperty(stmt));

                if (!hasGuard) {
                    const keyName = getKeyName(node.left);
                    const objText = context.sourceCode.getText(node.right);

                    if (!keyName) {
                        context.report({
                            node,
                            messageId: 'missingGuard',
                        });
                        return;
                    }

                    context.report({
                        node,
                        messageId: 'missingGuard',
                        fix(fixer) {
                            const sourceCode = context.sourceCode;
                            const innerStmts = body.type === 'BlockStatement' ? body.body : [body];

                            // Single-line loops keep compact output to avoid reformatting
                            // code the author intentionally wrote on one line.
                            const isSingleLine = node.loc.start.line === node.loc.end.line;
                            if (isSingleLine) {
                                const compactBody = innerStmts
                                    .map((stmt) => sourceCode.getText(stmt))
                                    .join(' ');
                                return fixer.replaceText(
                                    body,
                                    `{ if (${objText}.hasOwnProperty(${keyName})) { ${compactBody} } }`,
                                );
                            }

                            // Multi-line loops: emit a properly-indented guard block.
                            const loopLine = sourceCode.lines[node.loc.start.line - 1] ?? '';
                            const baseIndent = (loopLine.match(/^[\t ]*/) ?? [''])[0];
                            const firstStmt = innerStmts[0];
                            const firstStmtLine = firstStmt
                                ? (sourceCode.lines[firstStmt.loc.start.line - 1] ?? '')
                                : '';
                            const firstStmtIndent = (firstStmtLine.match(/^[\t ]*/) ?? [''])[0];
                            const unit =
                                firstStmtIndent.length > baseIndent.length
                                    ? firstStmtIndent.slice(baseIndent.length)
                                    : '    ';
                            const guardIndent = baseIndent + unit;
                            const stmtIndent = guardIndent + unit;

                            const guardedBody = innerStmts
                                .map((stmt) => `${stmtIndent}${sourceCode.getText(stmt)}`)
                                .join('\n');

                            return fixer.replaceText(
                                body,
                                `{\n${guardIndent}if (${objText}.hasOwnProperty(${keyName})) {\n${guardedBody}\n${guardIndent}}\n${baseIndent}}`,
                            );
                        },
                    });
                }
            },
        };
    },
};

function containsHasOwnProperty(node) {
    if (!node) {
        return false;
    }

    if (node.type === 'IfStatement' && node.test && hasOwnPropertyTest(node.test)) {
        return true;
    }

    if (node.type === 'IfStatement') {
        return (
            hasOwnPropertyTest(node.test) ||
            containsHasOwnProperty(node.consequent) ||
            containsHasOwnProperty(node.alternate)
        );
    }

    if (node.type === 'BlockStatement') {
        return node.body.some((child) => containsHasOwnProperty(child));
    }

    if (node.type === 'ExpressionStatement') {
        return containsHasOwnProperty(node.expression);
    }

    return false;
}

function hasOwnPropertyTest(node) {
    if (!node) {
        return false;
    }

    if (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'hasOwnProperty'
    ) {
        return true;
    }

    if (node.type === 'LogicalExpression') {
        return hasOwnPropertyTest(node.left) || hasOwnPropertyTest(node.right);
    }

    if (node.type === 'UnaryExpression') {
        return hasOwnPropertyTest(node.argument);
    }

    return false;
}

/**
 * Extracts the loop key variable name from a for-in left-hand side.
 * Handles both `for (var k in obj)` and `for (k in obj)`.
 *
 * @param left - The left-hand side node of a ForInStatement.
 * @returns The key variable name, or null if it cannot be determined.
 */
function getKeyName(left) {
    if (left.type === 'VariableDeclaration' && left.declarations.length > 0) {
        const id = left.declarations[0].id;
        return id.type === 'Identifier' ? id.name : null;
    }
    if (left.type === 'Identifier') {
        return left.name;
    }
    return null;
}
