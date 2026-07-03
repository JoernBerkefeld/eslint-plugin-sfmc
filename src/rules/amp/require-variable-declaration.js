/**
 * Requires that `@variables` are declared with `var` before being used in
 * `set` statements. System variables (@@) and personalization strings
 * (no @ prefix) are not affected.
 *
 * AMPscript does not technically require `var`, but the ampscript.guide
 * best-practices documentation recommends always declaring variables to
 * make code self-documenting and catch typos.
 */

export default {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description: 'Require variables to be declared with `var` before use',
            recommended: false,
        },
        messages: {
            undeclared:
                "'{{name}}' is used before being declared. Add `var {{name}}` before this `set` statement.",
        },
        schema: [],
    },

    create(context) {
        const declared = new Set();
        const fixedVariables = new Set();

        return {
            VarDeclaration(node) {
                for (const v of node.variables) {
                    declared.add(v.value.toLowerCase());
                }
            },

            SetStatement(node) {
                if (!node.target) {
                    return;
                }
                const name = node.target.value;
                if (name.startsWith('@@')) {
                    return;
                }
                const lower = name.toLowerCase();
                if (!declared.has(lower)) {
                    const isFirstFix = !fixedVariables.has(lower);
                    if (isFirstFix) {
                        fixedVariables.add(lower);
                    }

                    context.report({
                        node: node.target,
                        messageId: 'undeclared',
                        data: { name },
                        fix: isFirstFix
                            ? (fixer) => fixer.insertTextBefore(node, `var ${name}\n`)
                            : undefined,
                    });
                }
            },
        };
    },
};
