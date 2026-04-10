/**
 * Suggests wrapping bare personalization-string identifiers (e.g. `FirstName`)
 * in `AttributeValue("FirstName")` to prevent send-aborting errors when the
 * attribute is missing from the subscriber context.
 *
 * Only flags Identifier nodes that appear directly in SetStatement values or
 * as standalone ExpressionStatements — contexts where a bare attribute
 * reference is likely intentional data access rather than a function name or
 * a value inside a function call.
 */

import { functionNames } from 'ampscript-data';

const AMPSCRIPT_KEYWORDS = new Set([
    'var',
    'set',
    'if',
    'then',
    'elseif',
    'else',
    'endif',
    'for',
    'to',
    'downto',
    'do',
    'next',
    'and',
    'or',
    'not',
    'true',
    'false',
]);

function isLikelyPersonalization(node) {
    if (node.type !== 'Identifier') {
        return false;
    }
    const lower = node.value.toLowerCase();
    if (functionNames.has(lower)) {
        return false;
    }
    if (AMPSCRIPT_KEYWORDS.has(lower)) {
        return false;
    }
    return true;
}

export default {
    meta: {
        type: 'suggestion',
        hasSuggestions: true,
        docs: {
            description:
                'Prefer AttributeValue() over bare personalization strings for safe attribute access',
            recommended: false,
        },
        messages: {
            preferAttributeValue:
                'Use `AttributeValue("{{name}}")` instead of bare `{{name}}` to safely handle missing attributes.',
            wrapWithAttributeValue: "Wrap '{{name}}' in AttributeValue() for safe attribute access",
        },
        schema: [],
    },

    create(context) {
        function reportWithSuggestion(identNode) {
            context.report({
                node: identNode,
                messageId: 'preferAttributeValue',
                data: { name: identNode.value },
                suggest: [
                    {
                        messageId: 'wrapWithAttributeValue',
                        data: { name: identNode.value },
                        fix(fixer) {
                            return fixer.replaceText(
                                identNode,
                                `AttributeValue("${identNode.value}")`,
                            );
                        },
                    },
                ],
            });
        }

        return {
            SetStatement(node) {
                if (node.value && isLikelyPersonalization(node.value)) {
                    reportWithSuggestion(node.value);
                }
            },

            AmpExpressionStatement(node) {
                if (isLikelyPersonalization(node.expression)) {
                    reportWithSuggestion(node.expression);
                }
            },
        };
    },
};
