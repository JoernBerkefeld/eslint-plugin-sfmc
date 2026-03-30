/**
 * Rule: require-hasownproperty
 *
 * In for-in loops, require a hasOwnProperty guard to avoid iterating
 * over inherited properties (like _type) that SSJS objects may have.
 *
 * Suggestion: wraps the existing loop body in an
 * `if (obj.hasOwnProperty(key)) { ... }` guard.
 */

export default {
    meta: {
        type: 'suggestion',
        hasSuggestions: true,
        docs: {
            description: 'Require hasOwnProperty guard in for-in loops',
        },
        messages: {
            missingGuard:
                'Add a hasOwnProperty check inside for-in loops to avoid iterating over inherited properties.',
            suggestAddGuard:
                'Wrap the loop body in an `if ({{obj}}.hasOwnProperty({{key}})) { ... }` guard',
        },
        schema: [],
    },

    create(context) {
        return {
            ForInStatement(node) {
                const body = node.body;

                const stmts = body.type === 'BlockStatement' ? body.body : [body];

                if (stmts.length === 0) return;

                const hasGuard = stmts.some((stmt) => containsHasOwnProperty(stmt));

                if (!hasGuard) {
                    const keyName = getKeyName(node.left);
                    const objText = context.sourceCode.getText(node.right);

                    context.report({
                        node,
                        messageId: 'missingGuard',
                        suggest:
                            keyName
                                ? [
                                      {
                                          messageId: 'suggestAddGuard',
                                          data: { obj: objText, key: keyName },
                                          fix(fixer) {
                                              if (body.type === 'BlockStatement') {
                                                  // Wrap the inner content of the existing block.
                                                  const inner = context.sourceCode
                                                      .getText(body)
                                                      .slice(1, -1);
                                                  return fixer.replaceText(
                                                      body,
                                                      `{ if (${objText}.hasOwnProperty(${keyName})) {${inner}} }`,
                                                  );
                                              }
                                              // Single-statement body — create a new block with guard.
                                              const stmtText =
                                                  context.sourceCode.getText(body);
                                              return fixer.replaceText(
                                                  body,
                                                  `{ if (${objText}.hasOwnProperty(${keyName})) { ${stmtText} } }`,
                                              );
                                          },
                                      },
                                  ]
                                : [],
                    });
                }
            },
        };
    },
};

function containsHasOwnProperty(node) {
    if (!node) return false;

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
    if (!node) return false;

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
