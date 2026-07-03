/**
 * Rule: arg-types
 *
 * Validates literal arguments passed to AMPscript functions against the
 * constraints declared in the ampscript-data catalog. Currently it checks
 * parameters that declare an `enum` of allowed values: a static literal
 * argument (string, number, or boolean) must be one of those values
 * (case-insensitive). Variables and expressions are skipped because their
 * value cannot be determined statically.
 *
 * This rule is the AMPscript counterpart of `ssjs-arg-types` and may be
 * expanded later to cover additional argument-type checks.
 *
 * Example: DatePart('2026-01-15', 'decade') — 'decade' is not a valid datePart.
 */

import { functionLookup } from 'ampscript-data';

// AMPscript AST node types that represent a static, statically-resolvable literal.
const STATIC_LITERAL_TYPES = new Set(['StringLiteral', 'NumberLiteral', 'BooleanLiteral']);

/**
 * Returns the comparable string value of a static AMPscript literal node
 * (string, number, or boolean), or null when the argument is not a static
 * literal (e.g. a variable or expression) and cannot be validated against an
 * enum.
 *
 * @param {object} argument - AMPscript argument AST node.
 * @returns {string | null} The literal value as a string, or null.
 */
function staticLiteralValue(argument) {
    if (!argument || !STATIC_LITERAL_TYPES.has(argument.type)) {
        return null;
    }
    return String(argument.value);
}

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Check that literal arguments match the expected parameter types and allowed values for AMPscript functions',
            recommended: true,
        },
        messages: {
            invalidEnumValue:
                "Argument '{{param}}' of '{{name}}' must be one of: {{allowed}}. Received '{{actual}}'.",
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
                    if (
                        !parameter ||
                        !Array.isArray(parameter.enum) ||
                        parameter.enum.length === 0
                    ) {
                        continue;
                    }
                    // Only validate static literals (string, number, boolean);
                    // variables/expressions cannot be resolved statically.
                    const actual = staticLiteralValue(argument);
                    if (actual === null) {
                        continue;
                    }
                    const isAllowed = parameter.enum.some(
                        (v) => String(v).toLowerCase() === actual.toLowerCase(),
                    );
                    if (!isAllowed) {
                        context.report({
                            node: argument,
                            messageId: 'invalidEnumValue',
                            data: {
                                name: entry.name,
                                param: parameter.name,
                                allowed: parameter.enum.join(', '),
                                actual,
                            },
                        });
                    }
                }
            },
        };
    },
};
