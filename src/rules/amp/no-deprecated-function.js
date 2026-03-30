/**
 * Rule: no-deprecated-function
 *
 * Flags usage of deprecated AMPscript functions and suggests their
 * modern replacements.
 *
 * For 1:1 replacements (e.g. InsertDE -> InsertData) an auto-fix is provided.
 * For ambiguous replacements (e.g. ContentArea -> ContentBlockByKey OR
 * ContentBlockByName) two manual suggestions are offered instead.
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
                if (!functionName) return;

                const entry = deprecatedFunctionLookup.get(functionName.toLowerCase());
                if (!entry) return;

                const report = {
                    node,
                    messageId: 'deprecated',
                    data: {
                        name: functionName,
                        replacement: entry.replacement,
                        reason: entry.reason,
                    },
                };

                // Replacement strings that contain " or " have multiple options —
                // offer them as manual suggestions rather than a single auto-fix.
                const isMulti = entry.replacement.includes(' or ');

                if (isMulti) {
                    const options = entry.replacement.split(' or ').map((s) => s.trim());
                    report.suggest = options.map((opt) => ({
                        messageId: 'replaceWith',
                        data: { name: functionName, replacement: opt },
                        fix: (fixer) =>
                            fixer.replaceTextRange(
                                [node.range[0], node.range[0] + functionName.length],
                                opt,
                            ),
                    }));
                } else {
                    report.fix = (fixer) =>
                        fixer.replaceTextRange(
                            [node.range[0], node.range[0] + functionName.length],
                            entry.replacement,
                        );
                }

                context.report(report);
            },
        };
    },
};
