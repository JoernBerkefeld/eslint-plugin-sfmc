export default {
    meta: {
        type: 'suggestion',
        hasSuggestions: true,
        docs: {
            description: 'Disallow empty AMPscript blocks that produce no output or side effects',
            recommended: true,
        },
        messages: {
            emptyBlock: 'Empty AMPscript block. Remove it or add content.',
            removeEmptyBlock: 'Remove the empty AMPscript block',
        },
        schema: [],
    },

    create(context) {
        return {
            Block(node) {
                const meaningful = (node.statements || []).filter((s) => s.type !== 'Comment');
                if (meaningful.length === 0) {
                    context.report({
                        node,
                        messageId: 'emptyBlock',
                        suggest: [
                            {
                                messageId: 'removeEmptyBlock',
                                fix(fixer) {
                                    return fixer.removeRange(node.range);
                                },
                            },
                        ],
                    });
                }
            },
        };
    },
};
