/**
 * Inline expressions (%%=...=%%) should contain a single output expression,
 * not control-flow statements like `if`, `for`, `set`, or `var`.
 *
 * These constructs belong in block AMPscript (%%[...]%%).
 */

const STATEMENT_TYPES = new Set([
    'AmpIfStatement',
    'AmpForStatement',
    'SetStatement',
    'VarDeclaration',
]);

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow control-flow statements inside inline expressions (%%=...=%%)',
            recommended: true,
        },
        messages: {
            inlineStatement:
                'Inline expressions (%%=...=%%) should contain a single output expression. Move {{kind}} to a block (%%[...]%%).',
        },
        schema: [],
    },

    create(context) {
        return {
            InlineExpression(node) {
                const expression = node.expression;
                if (!expression) {
                    return;
                }

                if (STATEMENT_TYPES.has(expression.type)) {
                    context.report({
                        node: expression,
                        messageId: 'inlineStatement',
                        data: { kind: expression.type },
                    });
                }
            },
        };
    },
};
