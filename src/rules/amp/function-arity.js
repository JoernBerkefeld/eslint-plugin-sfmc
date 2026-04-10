import { functionLookup } from 'ampscript-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce correct argument counts for known AMPscript functions',
            recommended: true,
        },
        messages: {
            tooFewArgs:
                "'{{name}}' requires at least {{min}} argument(s) but was called with {{actual}}.",
            tooManyArgs:
                "'{{name}}' accepts at most {{max}} argument(s) but was called with {{actual}}.",
        },
        schema: [],
    },

    create(context) {
        return {
            FunctionCall(node) {
                const entry = functionLookup.get(node.name.toLowerCase());
                if (!entry) {
                    return;
                }

                const actual = node.arguments.length;

                if (actual < entry.minArgs) {
                    context.report({
                        node,
                        messageId: 'tooFewArgs',
                        data: {
                            name: entry.name,
                            min: String(entry.minArgs),
                            actual: String(actual),
                        },
                    });
                } else if (actual > entry.maxArgs) {
                    context.report({
                        node,
                        messageId: 'tooManyArgs',
                        data: {
                            name: entry.name,
                            max: String(entry.maxArgs),
                            actual: String(actual),
                        },
                    });
                }
            },
        };
    },
};
