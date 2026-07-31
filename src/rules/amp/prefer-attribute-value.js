/**
 * Suggests wrapping custom personalization strings in `AttributeValue("...")`
 * to prevent send-aborting errors when the attribute is missing from the
 * subscriber context. Applies to both bare identifiers (e.g. `FirstName`) and
 * bracket notation (e.g. `[First Name]`).
 *
 * Known Marketing Cloud system personalization strings (e.g. `_subscriberkey`,
 * `emailaddr`, `[MSG(0).NOUN(0)]`) are exempt in either form. Only flags nodes
 * that appear directly in SetStatement values or as standalone
 * ExpressionStatements — contexts where a bare attribute reference is likely
 * intentional data access rather than a function name.
 */

import { functionNames, isSystemPersonalizationString } from 'ampscript-data';

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

/**
 * Returns the attribute name a node refers to when it is a candidate for the
 * AttributeValue() suggestion, or null when the node should be ignored (a
 * function name, keyword, or known system personalization string).
 *
 * @param {object} node - AMPscript AST node to inspect.
 * @returns {string | null} The attribute name to wrap, or null.
 */
function personalizationName(node) {
    if (!node) {
        return null;
    }
    if (node.type === 'Identifier') {
        const lower = node.value.toLowerCase();
        if (functionNames.has(lower) || AMPSCRIPT_KEYWORDS.has(lower)) {
            return null;
        }
        if (isSystemPersonalizationString(node.value)) {
            return null;
        }
        return node.value;
    }
    if (node.type === 'PersonalizationString') {
        if (isSystemPersonalizationString(node.value)) {
            return null;
        }
        return node.value;
    }
    return null;
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
        function reportWithSuggestion(node, name) {
            // Escape embedded double quotes so the generated
            // AttributeValue("…") call stays syntactically valid.
            const escaped = name.replaceAll('"', String.raw`\"`);
            context.report({
                node,
                messageId: 'preferAttributeValue',
                data: { name },
                suggest: [
                    {
                        messageId: 'wrapWithAttributeValue',
                        data: { name },
                        fix(fixer) {
                            return fixer.replaceText(node, `AttributeValue("${escaped}")`);
                        },
                    },
                ],
            });
        }

        return {
            SetStatement(node) {
                const name = personalizationName(node.value);
                if (name !== null) {
                    reportWithSuggestion(node.value, name);
                }
            },

            AmpExpressionStatement(node) {
                const name = personalizationName(node.expression);
                if (name !== null) {
                    reportWithSuggestion(node.expression, name);
                }
            },
        };
    },
};
