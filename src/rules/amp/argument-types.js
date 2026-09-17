/**
 * Rule: arg-types
 *
 * Validates literal arguments passed to AMPscript functions against the
 * constraints declared in the ampscript-data catalog. Currently it checks
 * parameters that declare an `enum` of allowed values: a static literal
 * argument (string, number, or boolean) must be one of those values. Primitive
 * types are preserved; string values compare case-insensitively only with other
 * strings. Variables and expressions are skipped because their value cannot be
 * determined statically.
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
 * Returns the primitive value of a static AMPscript literal node, or null when
 * the argument is not a static literal (e.g. a variable or expression) and
 * cannot be validated against an enum.
 *
 * @param {object} argument - AMPscript argument AST node.
 * @returns {string | number | boolean | null} The type-preserved literal value, or null.
 */
function staticLiteralValue(argument) {
    if (!argument || !STATIC_LITERAL_TYPES.has(argument.type)) {
        return null;
    }
    if (argument.type === 'NumberLiteral') {
        return Number(argument.value);
    }
    if (argument.type === 'BooleanLiteral') {
        return String(argument.value).toLowerCase() === 'true';
    }
    return String(argument.value);
}

/**
 * Compare a static literal with one catalog enum member without collapsing
 * strings, numbers, and booleans into the same textual value. String matching
 * remains case-insensitive.
 *
 * @param {string | number | boolean} allowed - Catalog enum member.
 * @param {string | number | boolean} actual - Static AMPscript literal value.
 * @returns {boolean} Whether the values match with type-sensitive semantics.
 */
function enumValueMatches(allowed, actual) {
    if (typeof allowed !== typeof actual) {
        return false;
    }
    if (typeof allowed === 'string' && typeof actual === 'string') {
        return allowed.toLowerCase() === actual.toLowerCase();
    }
    return allowed === actual;
}

/**
 * Format a catalog enum member as an AMPscript literal so string members are
 * visibly distinct from number and boolean members in diagnostics.
 *
 * @param {string | number | boolean} value - Catalog enum member.
 * @returns {string} AMPscript literal text.
 */
function formatEnumLiteral(value) {
    return typeof value === 'string' ? `"${value}"` : String(value);
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
                    const isAllowed = parameter.enum.some((value) =>
                        enumValueMatches(value, actual),
                    );
                    if (!isAllowed) {
                        context.report({
                            node: argument,
                            messageId: 'invalidEnumValue',
                            data: {
                                name: entry.name,
                                param: parameter.name,
                                allowed: parameter.enum
                                    .map((value) => formatEnumLiteral(value))
                                    .join(', '),
                                actual,
                            },
                        });
                    }
                }
            },
        };
    },
};
