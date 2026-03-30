/**
 * Rule: no-switch-default
 *
 * The `default` case in switch statements may silently fail to execute in
 * SFMC's SSJS engine. Explicitly enumerate all expected values instead.
 */

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                "Disallow 'default' case in switch statements because SFMC SSJS may not process it",
        },
        messages: {
            noDefault:
                "The 'default' case in a switch statement may not execute in SFMC SSJS. " +
                'List all expected values as explicit cases instead.',
        },
        schema: [],
    },

    create(context) {
        return {
            SwitchCase(node) {
                if (node.test === null) {
                    context.report({ node, messageId: 'noDefault' });
                }
            },
        };
    },
};
