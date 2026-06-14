import { functionLookup } from 'ampscript-data';

/**
 * Reads a numeric-literal argument value from an AMPscript AST argument node.
 * Returns the integer when the argument is a positive integer literal, otherwise null.
 *
 * @param {object} argument - AMPscript argument AST node.
 * @returns {number | null} The integer value, or null when it is not a usable literal.
 */
function readIntLiteral(argument) {
    if (!argument) {
        return null;
    }
    // NumberLiteral / StringLiteral nodes both carry the raw value as a string.
    if (argument.type === 'NumberLiteral' || argument.type === 'StringLiteral') {
        const n = Number(argument.value);
        return Number.isInteger(n) && n >= 0 ? n : null;
    }
    return null;
}

/**
 * Validates the repeating-group structure of a variadic AMPscript call.
 * Returns a messageId + data object when the trailing arguments do not form
 * complete repeating groups, otherwise null.
 *
 * @param {object} entry - ampscript-data function entry (with `repeat`).
 * @param {object[]} args - the call's argument AST nodes.
 * @returns {{messageId: string, data: object} | null} Violation descriptor or null.
 */
function checkRepeatGroups(entry, args) {
    const groups = entry.repeat;
    if (!Array.isArray(groups) || groups.length === 0) {
        return null;
    }
    const actual = args.length;

    // Single repeating group: trailing args must be a whole multiple of groupSize.
    if (groups.length === 1) {
        const { startIndex, groupSize, minGroups } = groups[0];
        if (actual <= startIndex) {
            // not enough args even to start the group; minArgs check handles "too few"
            return minGroups > 0 && actual < startIndex + groupSize * minGroups
                ? incompleteGroup(entry, groupSize)
                : null;
        }
        const trailing = actual - startIndex;
        if (trailing % groupSize !== 0) {
            return incompleteGroup(entry, groupSize);
        }
        if (trailing / groupSize < minGroups) {
            return incompleteGroup(entry, groupSize);
        }
        return null;
    }

    // Two repeating groups (DataExtension Update/Upsert family): the first group's
    // size is dictated by a countParam literal; the second group fills the rest.
    const [g1, g2] = groups;
    const countArg = g1.countParam
        ? readIntLiteral(args[entry.params.findIndex((p) => p.name === g1.countParam)])
        : null;

    if (countArg === null) {
        // countParam is not a literal we can evaluate; fall back to a parity check:
        // every trailing arg pair must be even across both groups.
        const trailing = actual - g1.startIndex;
        return trailing % g1.groupSize === 0 ? null : incompleteGroup(entry, g1.groupSize);
    }

    const group1Args = countArg * g1.groupSize;
    const group2Start = g1.startIndex + group1Args;
    const group2Count = actual - group2Start;
    if (group2Count <= 0 || group2Count % g2.groupSize !== 0) {
        return incompleteGroup(entry, g2.groupSize);
    }
    return null;
}

/**
 * Builds the incompleteGroup report descriptor.
 *
 * @param {object} entry - ampscript-data function entry.
 * @param {number} groupSize - size of the repeating unit that is incomplete.
 * @returns {{messageId: string, data: object}} Report descriptor.
 */
function incompleteGroup(entry, groupSize) {
    return {
        messageId: 'incompleteGroup',
        data: { name: entry.name, size: String(groupSize) },
    };
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce correct argument counts for known AMPscript functions',
            recommended: true,
        },
        messages: {
            tooFewArgs:
                "'{{name}}' requires at least {{min}} argument(s) but was called with {{actual}}.",
            tooManyArgs:
                "'{{name}}' accepts at most {{max}} argument(s) but was called with {{actual}}.",
            incompleteGroup:
                "'{{name}}' expects its repeating arguments in complete groups of {{size}}.",
        },
        schema: [],
    },

    create(context) {
        return {
            FunctionCall(node) {
                const entry = functionLookup.get(node.name.toLowerCase());
                if (!entry) {
                    return;
                }

                const actual = node.arguments.length;

                if (actual < entry.minArgs) {
                    context.report({
                        node,
                        messageId: 'tooFewArgs',
                        data: {
                            name: entry.name,
                            min: String(entry.minArgs),
                            actual: String(actual),
                        },
                    });
                    return;
                }
                if (actual > entry.maxArgs) {
                    context.report({
                        node,
                        messageId: 'tooManyArgs',
                        data: {
                            name: entry.name,
                            max: String(entry.maxArgs),
                            actual: String(actual),
                        },
                    });
                    return;
                }

                const groupViolation = checkRepeatGroups(entry, node.arguments);
                if (groupViolation) {
                    context.report({ node, ...groupViolation });
                }
            },
        };
    },
};
