/**
 * Rule: prefer-boolean-literal
 *
 * Recommends and safely fixes bare boolean literals for every catalogued
 * boolean-like parameter, all of which accept the same eight static forms.
 */

import { functionLookup } from 'ampscript-data';

const BOOLEAN_LIKE_ENUM = [true, false, 1, 0, 'true', 'false', '1', '0'];

/**
 * Return the preferred boolean for an accepted alternative literal.
 *
 * @param {object} argument - AMPscript argument AST node.
 * @returns {boolean | null} Preferred boolean, or null when no recommendation applies.
 */
function preferredBoolean(argument) {
    if (argument?.type === 'NumberLiteral') {
        const value = Number(argument.value);
        return value === 1 || (value !== 0 && null);
    }
    if (argument?.type === 'StringLiteral') {
        const value = String(argument.value).toLowerCase();
        if (value === 'true' || value === '1') {
            return true;
        }
        if (value === 'false' || value === '0') {
            return false;
        }
    }
    return null;
}

/**
 * Check whether catalog metadata marks a parameter as boolean-like.
 *
 * @param {object} parameter - AMPscript catalog parameter.
 * @returns {boolean} Whether the enum contains exactly the complete eight-value set.
 */
export function isBooleanLikeParameter(parameter) {
    return (
        Array.isArray(parameter?.enum) &&
        parameter.enum.length === BOOLEAN_LIKE_ENUM.length &&
        BOOLEAN_LIKE_ENUM.every((value) => parameter.enum.includes(value))
    );
}

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Auto-fix accepted boolean-like AMPscript alternatives to recommended bare booleans',
            recommended: true,
        },
        fixable: 'code',
        messages: {
            preferBooleanLiteral:
                "Use bare {{preferred}} for boolean-like argument '{{param}}' of '{{name}}' instead of {{actual}}.",
        },
        schema: [],
    },

    create(context) {
        return {
            FunctionCall(node) {
                const entry = functionLookup.get(node.name.toLowerCase());
                if (!entry || !Array.isArray(entry.params)) {
                    return;
                }

                for (const [index, argument] of node.arguments.entries()) {
                    const parameter = entry.params[index];
                    if (!isBooleanLikeParameter(parameter)) {
                        continue;
                    }
                    const preferred = preferredBoolean(argument);
                    if (preferred === null) {
                        continue;
                    }
                    context.report({
                        node: argument,
                        messageId: 'preferBooleanLiteral',
                        data: {
                            name: entry.name,
                            param: parameter.name,
                            preferred: String(preferred),
                            actual: context.sourceCode.getText(argument),
                        },
                        fix(fixer) {
                            return fixer.replaceText(argument, String(preferred));
                        },
                    });
                }
            },
        };
    },
};
