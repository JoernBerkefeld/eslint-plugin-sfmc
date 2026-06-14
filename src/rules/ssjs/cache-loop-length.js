/**
 * Rule: cache-loop-length
 *
 * Flags `for` loops where `.length` is re-evaluated on every iteration.
 * Recommends caching the length in a variable for better SSJS performance.
 *
 * Bad:  for (var i = 0; i < arr.length; i++)
 * Good: for (var i = 0, _len = arr.length; i < _len; i++)
 *
 * Auto-fix: when the for-loop init is a VariableDeclaration (the common
 * case), appends `, _len = arr.length` to the declarator list and replaces
 * `arr.length` with `_len` in the test expression.
 */

export default {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description: 'Require caching array length in for-loop conditions',
        },
        messages: {
            cacheLength:
                "Cache '.length' in a variable to avoid re-evaluation on each iteration (e.g. `for (var i = 0, _len = arr.length; i < _len; i++)`).",
        },
        schema: [],
    },

    create(context) {
        return {
            ForStatement(node) {
                const test = node.test;
                if (!test || test.type !== 'BinaryExpression') {
                    return;
                }

                let lengthExpr = null;
                if (containsMemberLength(test.right)) {
                    lengthExpr = test.right;
                } else if (containsMemberLength(test.left)) {
                    lengthExpr = test.left;
                }

                if (!lengthExpr) {
                    return;
                }

                const fix = buildCacheFix(node, lengthExpr, context);

                context.report({
                    node: test,
                    messageId: 'cacheLength',
                    ...(fix ? { fix } : {}),
                });
            },
        };
    },
};

function containsMemberLength(node) {
    if (!node) {
        return false;
    }
    if (
        node.type === 'MemberExpression' &&
        node.property.type === 'Identifier' &&
        node.property.name === 'length'
    ) {
        return true;
    }
    return false;
}

function buildCacheFix(forNode, lengthExpr, context) {
    const init = forNode.init;
    // Only fix when init is a VariableDeclaration so we can safely
    // append a new declarator without restructuring the loop header.
    if (!init || init.type !== 'VariableDeclaration' || init.declarations.length === 0) {
        return null;
    }

    const objText = context.sourceCode.getText(lengthExpr.object);
    const lenVar = '_len';

    return function fix(fixer) {
        const lastDecl = init.declarations.at(-1);
        return [
            fixer.insertTextAfter(lastDecl, `, ${lenVar} = ${objText}.length`),
            fixer.replaceText(lengthExpr, lenVar),
        ];
    };
}
