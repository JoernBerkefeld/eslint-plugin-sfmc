/**
 * Enforces a naming convention for @variable names in AMPscript.
 *
 * AMPscript variables are case-insensitive, but consistent casing improves
 * readability and reduces confusion during code reviews.
 */

const CAMEL_CASE = /^@[a-z][a-zA-Z0-9]*$/;
const PASCAL_CASE = /^@[A-Z][a-zA-Z0-9]*$/;

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Enforce a consistent naming convention for @variable names',
            recommended: false,
        },
        messages: {
            badName: "Variable '{{name}}' does not match the required {{format}} format.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    format: {
                        enum: ['camelCase', 'PascalCase'],
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const format = (context.options[0] && context.options[0].format) || 'camelCase';
        const pattern = format === 'PascalCase' ? PASCAL_CASE : CAMEL_CASE;
        const reported = new Set();

        return {
            Variable(node) {
                const name = node.value;
                if (!name.startsWith('@') || name.startsWith('@@')) return;

                const key = name.toLowerCase();
                if (reported.has(key)) return;

                if (!pattern.test(name)) {
                    reported.add(key);
                    context.report({
                        node,
                        messageId: 'badName',
                        data: { name, format },
                    });
                }
            },
        };
    },
};
