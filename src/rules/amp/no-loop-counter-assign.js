/**
 * Flags `set` statements inside a `for` loop that target the loop counter
 * variable. Modifying the counter is documented as causing validation or
 * runtime errors in AMPscript.
 */

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Disallow assigning to the `for` loop counter variable inside the loop body',
            recommended: true,
        },
        messages: {
            counterAssign:
                "Do not assign to loop counter '{{name}}' inside the for loop. AMPscript does not allow modifying the counter variable.",
        },
        schema: [],
    },

    create(context) {
        const counterStack = [];

        function checkBody(body) {
            for (const stmt of body) {
                if (stmt.type === 'SetStatement' && stmt.target) {
                    const current = counterStack.at(-1);
                    if (current && stmt.target.value.toLowerCase() === current.toLowerCase()) {
                        context.report({
                            node: stmt.target,
                            messageId: 'counterAssign',
                            data: { name: stmt.target.value },
                        });
                    }
                }
                if (stmt.type === 'VarDeclaration') {
                    const current = counterStack.at(-1);
                    if (current) {
                        for (const v of stmt.variables) {
                            if (v.value.toLowerCase() === current.toLowerCase()) {
                                context.report({
                                    node: v,
                                    messageId: 'counterAssign',
                                    data: { name: v.value },
                                });
                            }
                        }
                    }
                }
            }
        }

        return {
            AmpForStatement(node) {
                if (node.counter) {
                    counterStack.push(node.counter.value);
                }
                if (node.body) {
                    checkBody(node.body);
                }
            },

            'AmpForStatement:exit'(node) {
                if (node.counter) {
                    counterStack.pop();
                }
            },
        };
    },
};
