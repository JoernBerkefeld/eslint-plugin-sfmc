import { functionNames } from 'ampscript-data';

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
        },
        schema: [],
    },

    create(context) {
        return {
            FunctionCall(node) {
                if (!functionNames.has(node.name.toLowerCase())) {
                    context.report({
                        node,
                        messageId: 'unknownFunction',
                        data: { name: node.name },
                    });
                }
            },
        };
    },
};
