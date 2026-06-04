import { functionNames, isMcnSupported } from 'ampscript-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow function calls to names not in the known AMPscript function catalog',
            recommended: true,
        },
        messages: {
            unknownFunction:
                "'{{name}}' is not a recognized AMPscript function. AMPscript does not support custom functions.",
            notSupportedInMcn: "'{{name}}' is not supported in Marketing Cloud Next.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    target: {
                        type: 'string',
                        enum: ['engagement', 'next'],
                        description:
                            "Target platform. Set to 'next' to additionally flag functions not available in Marketing Cloud Next.",
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] ?? {};
        const targetNext = options.target === 'next';

        return {
            FunctionCall(node) {
                const lower = node.name.toLowerCase();

                if (!functionNames.has(lower)) {
                    context.report({
                        node,
                        messageId: 'unknownFunction',
                        data: { name: node.name },
                    });
                    return;
                }

                if (targetNext && !isMcnSupported(lower)) {
                    context.report({
                        node,
                        messageId: 'notSupportedInMcn',
                        data: { name: node.name },
                    });
                }
            },
        };
    },
};
