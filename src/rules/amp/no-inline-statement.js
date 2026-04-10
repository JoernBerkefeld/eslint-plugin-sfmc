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
                const expr = node.expression;
                if (!expr) {
                    return;
                }

                if (STATEMENT_TYPES.has(expr.type)) {
                    context.report({
                        node: expr,
                        messageId: 'inlineStatement',
                        data: { kind: expr.type },
                    });
                }
            },
        };
    },
};
