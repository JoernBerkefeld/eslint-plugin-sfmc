export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require `set` statements to have a target variable',
            recommended: true,
        },
        messages: {
            missingTarget:
                '`set` statement is missing a target variable. Expected: `set @variable = expression`.',
        },
        schema: [],
    },

    create(context) {
        return {
            SetStatement(node) {
                if (!node.target) {
                    context.report({
                        node,
                        messageId: 'missingTarget',
                    });
                }
            },
        };
    },
};
