/**
 * Rule: no-deprecated-function
 *
 * Flags usage of deprecated AMPscript functions and suggests their
 * modern replacements.
 *
 * Deprecation metadata is read inline from the FUNCTIONS catalog via the
 * `deprecatedReplacement` and `deprecatedReason` fields. A 1:1 auto-fix is
 * provided for each deprecated function.
 */

import { deprecatedFunctionLookup } from 'ampscript-data';

export default {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        hasSuggestions: true,
        docs: {
            description: 'Disallow deprecated AMPscript functions and suggest replacements',
        },
        messages: {
            deprecated: "'{{name}}' is deprecated. Use {{replacement}} instead. {{reason}}",
            replaceWith: "Replace '{{name}}' with '{{replacement}}'",
        },
        schema: [],
    },

    create(context) {
        return {
            FunctionCall(node) {
                const functionName = node.name || (node.callee && node.callee.name) || '';
                if (!functionName) {
                    return;
                }

                const entry = deprecatedFunctionLookup.get(functionName.toLowerCase());
                if (!entry) {
                    return;
                }

                const replacement = entry.deprecatedReplacement;

                context.report({
                    node,
                    messageId: 'deprecated',
                    data: {
                        name: functionName,
                        replacement,
                        reason: entry.deprecatedReason,
                    },
                    fix: (fixer) =>
                        fixer.replaceTextRange(
                            [node.range[0], node.range[0] + functionName.length],
                            replacement,
                        ),
                });
            },
        };
    },
};
