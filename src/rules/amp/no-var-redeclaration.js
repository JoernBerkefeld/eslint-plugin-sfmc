export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow re-declaring a variable with `var` (silently resets value to null)',
            recommended: true,
        },
        messages: {
            redeclared:
                "'{{name}}' has already been declared. Re-declaring with `var` silently resets its value to null.",
        },
        schema: [],
    },

    create(context) {
        const declared = new Map();

        return {
            VarDeclaration(node) {
                for (const variable of node.variables) {
                    const lower = variable.value.toLowerCase();
                    if (declared.has(lower)) {
                        context.report({
                            node: variable,
                            messageId: 'redeclared',
                            data: { name: variable.value },
                        });
                    } else {
                        declared.set(lower, variable);
                    }
                }
            },
        };
    },
};
