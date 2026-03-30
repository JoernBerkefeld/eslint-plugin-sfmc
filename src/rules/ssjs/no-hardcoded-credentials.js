/**
 * Rule: no-hardcoded-credentials
 *
 * Detects string literals passed as key/IV/salt arguments to
 * Platform.Function.DecryptSymmetric and EncryptSymmetric calls.
 * These should use variable references (e.g. from a DE lookup)
 * instead of hardcoded values.
 */

const ENCRYPT_FUNCTIONS = new Set(['encryptsymmetric', 'decryptsymmetric']);

const KEY_ARG_INDICES = [1, 3, 5, 7];

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow hardcoded credentials in encryption/decryption calls',
        },
        messages: {
            hardcodedCredential:
                'Avoid hardcoded keys, IVs, or salts in {{fn}}(). Use a variable or DE lookup instead.',
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                const callee = node.callee;

                let functionName = null;

                if (
                    callee.type === 'MemberExpression' &&
                    callee.object.type === 'MemberExpression' &&
                    callee.object.object.type === 'Identifier' &&
                    callee.object.object.name === 'Platform' &&
                    callee.object.property.type === 'Identifier' &&
                    callee.object.property.name === 'Function' &&
                    callee.property.type === 'Identifier'
                ) {
                    functionName = callee.property.name;
                }

                if (!functionName || !ENCRYPT_FUNCTIONS.has(functionName.toLowerCase())) return;

                for (const index of KEY_ARG_INDICES) {
                    const argument = node.arguments[index];
                    if (
                        argument &&
                        argument.type === 'Literal' &&
                        typeof argument.value === 'string' &&
                        argument.value.length > 0
                    ) {
                        context.report({
                            node: argument,
                            messageId: 'hardcodedCredential',
                            data: { fn: functionName },
                        });
                    }
                }
            },
        };
    },
};
