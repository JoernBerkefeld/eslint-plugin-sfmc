/**
 * Rule: no-email-excluded-function
 *
 * Flags calls to AMPscript functions that are not available in the email
 * execution context. These functions only work on CloudPages, landing pages,
 * and other non-email contexts. Using them in emails causes runtime errors.
 */

import { isEmailExcluded } from 'ampscript-data';

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow AMPscript functions that are not available in email context',
        },
        messages: {
            emailExcluded:
                "'{{name}}' is not available in the email execution context. This function only works on CloudPages and landing pages.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    context: {
                        enum: ['email', 'cloudpage', 'auto'],
                        default: 'email',
                        description:
                            'Set to "email" to flag email-excluded functions, "cloudpage" to skip checking, "auto" to infer from file extension.',
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] || {};
        const contextMode = options.context || 'email';

        if (contextMode === 'cloudpage') {
            return {};
        }

        if (contextMode === 'auto') {
            const filename = context.filename || '';
            const lower = filename.toLowerCase();
            if (
                lower.includes('cloudpage') ||
                lower.includes('landing') ||
                lower.endsWith('.html')
            ) {
                return {};
            }
        }

        return {
            FunctionCall(node) {
                const functionName = node.name || (node.callee && node.callee.name) || '';
                if (!functionName) {
                    return;
                }

                if (isEmailExcluded(functionName)) {
                    context.report({
                        node,
                        messageId: 'emailExcluded',
                        data: { name: functionName },
                    });
                }
            },
        };
    },
};
