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

                const statements = body.type === 'BlockStatement' ? body.body : [body];

                if (statements.length === 0) {
                    return;
                }

                const hasGuard = statements.some((statement) => containsHasOwnProperty(statement));

                if (!hasGuard) {
                    const keyName = getKeyName(node.left);
                    const objectText = context.sourceCode.getText(node.right);

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
                            const innerStatements =
                                body.type === 'BlockStatement' ? body.body : [body];

                            // Single-line loops keep compact output to avoid reformatting
                            // code the author intentionally wrote on one line.
                            const isSingleLine = node.loc.start.line === node.loc.end.line;
                            if (isSingleLine) {
                                const compactBody = innerStatements
                                    .map((statement) => sourceCode.getText(statement))
                                    .join(' ');
                                return fixer.replaceText(
                                    body,
                                    `{ if (${objectText}.hasOwnProperty(${keyName})) { ${compactBody} } }`,
                                );
                            }

                            // Multi-line loops: emit a properly-indented guard block.
                            const loopLine = sourceCode.lines[node.loc.start.line - 1] ?? '';
                            const baseIndent = (loopLine.match(/^[\t ]*/) ?? [''])[0];
                            const firstStatement = innerStatements[0];
                            const firstStatementLine = firstStatement
                                ? (sourceCode.lines[firstStatement.loc.start.line - 1] ?? '')
                                : '';
                            const firstStatementIndent = (firstStatementLine.match(/^[\t ]*/) ?? [
                                '',
                            ])[0];
                            const unit =
                                firstStatementIndent.length > baseIndent.length
                                    ? firstStatementIndent.slice(baseIndent.length)
                                    : ' '.repeat(4);
                            const guardIndent = baseIndent + unit;
                            const statementIndent = guardIndent + unit;

                            const guardedBody = innerStatements
                                .map(
                                    (statement) =>
                                        `${statementIndent}${sourceCode.getText(statement)}`,
                                )
                                .join('\n');

                            return fixer.replaceText(
                                body,
                                `{\n${guardIndent}if (${objectText}.hasOwnProperty(${keyName})) {\n${guardedBody}\n${guardIndent}}\n${baseIndent}}`,
                            );
                        },
                    });
                }
            },
        };
    },
};

function containsHasOwnProperty(node) {
    let current = node;

    // Unwrap pass-through single-child nodes iteratively to avoid tail recursion.
    while (current && current.type === 'ExpressionStatement') {
        current = current.expression;
    }

    if (!current) {
        return false;
    }

    if (current.type === 'IfStatement' && current.test && hasOwnPropertyTest(current.test)) {
        return true;
    }

    if (current.type === 'IfStatement') {
        return (
            hasOwnPropertyTest(current.test) ||
            containsHasOwnProperty(current.consequent) ||
            containsHasOwnProperty(current.alternate)
        );
    }

    if (current.type === 'BlockStatement') {
        return current.body.some((child) => containsHasOwnProperty(child));
    }

    return false;
}

function hasOwnPropertyTest(node) {
    let current = node;

    // Unwrap negations / unary wrappers iteratively to avoid tail recursion.
    while (current && current.type === 'UnaryExpression') {
        current = current.argument;
    }

    if (!current) {
        return false;
    }

    if (
        current.type === 'CallExpression' &&
        current.callee.type === 'MemberExpression' &&
        current.callee.property.type === 'Identifier' &&
        current.callee.property.name === 'hasOwnProperty'
    ) {
        return true;
    }

    if (current.type === 'LogicalExpression') {
        return hasOwnPropertyTest(current.left) || hasOwnPropertyTest(current.right);
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
