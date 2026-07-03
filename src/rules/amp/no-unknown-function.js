import { functionNames, functionLookup, isMcnSupported } from 'ampscript-data';

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
            noHandlebarsEquivalent:
                "'{{name}}' is supported by Marketing Cloud Next AMPscript but has no Handlebars for Marketing Cloud Next equivalent. It cannot be migrated to a Handlebars helper.",
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
        const isTargetNext = options.target === 'next';

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

                if (isTargetNext && !isMcnSupported(lower)) {
                    context.report({
                        node,
                        messageId: 'notSupportedInMcn',
                        data: { name: node.name },
                    });
                    return;
                }

                // Category C: the function works in MCN AMPscript but has no
                // Handlebars counterpart, so it cannot be migrated to Handlebars.
                if (isTargetNext && functionLookup.get(lower)?.mcnHandlebarsGap === true) {
                    context.report({
                        node,
                        messageId: 'noHandlebarsEquivalent',
                        data: { name: node.name },
                    });
                }
            },
        };
    },
};
