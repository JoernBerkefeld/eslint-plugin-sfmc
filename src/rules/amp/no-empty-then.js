/**
 * Flags IF statements whose THEN branch (consequent) is empty.
 *
 * An empty consequent is almost always a mistake — either the condition
 * should be inverted (logic moved to ELSE) or the body was accidentally
 * deleted.
 */

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow IF statements with an empty THEN consequent',
            recommended: true,
        },
        messages: {
            emptyThen: 'IF block has an empty THEN consequent.',
        },
        schema: [],
    },

    create(context) {
        return {
            AmpIfStatement(node) {
                if (node.consequent && node.consequent.length === 0) {
                    context.report({
                        node,
                        messageId: 'emptyThen',
                    });
                }
            },
        };
    },
};
