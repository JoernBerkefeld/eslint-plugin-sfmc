/**
 * Requires a RowCount > 0 guard before iterating over a LookupRows result
 * with a FOR loop.
 *
 * Without the check, a RowCount of 0 causes a runtime error inside the loop.
 * This rule tracks variables assigned from LookupRows/LookupOrderedRows
 * (and their CS variants), then verifies that a RowCount check appears in
 * an IF condition before the variable is used as a FOR loop's data source.
 */

const LOOKUP_FUNCTIONS = new Set([
    'lookuprows',
    'lookuporderedrows',
    'lookuprowscs',
    'lookuporderedrowscs',
]);

function isLookupCall(node) {
    return node && node.type === 'FunctionCall' && LOOKUP_FUNCTIONS.has(node.name.toLowerCase());
}

function isRowCountCall(node) {
    return node && node.type === 'FunctionCall' && node.name.toLowerCase() === 'rowcount';
}

function extractRowCountVariables(node, into) {
    if (!node) return;

    if (isRowCountCall(node) && node.arguments && node.arguments.length > 0) {
        const argument = node.arguments[0];
        if (argument.type === 'Variable') {
            into.add(argument.value.toLowerCase());
        }
    }

    if (node.type === 'BinaryExpression') {
        extractRowCountVariables(node.left, into);
        extractRowCountVariables(node.right, into);
    }

    if (node.type === 'LogicalExpression') {
        extractRowCountVariables(node.left, into);
        extractRowCountVariables(node.right, into);
    }

    if (node.type === 'FunctionCall' && node.arguments) {
        for (const argument of node.arguments) {
            extractRowCountVariables(argument, into);
        }
    }
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Require a RowCount > 0 check before using a LookupRows result in a FOR loop',
            recommended: true,
        },
        messages: {
            missingRowCount:
                "Variable '{{name}}' is used in a FOR loop without a prior RowCount > 0 check. This causes a runtime error when the rowset is empty.",
        },
        schema: [],
    },

    create(context) {
        const lookupVariables = new Map();
        const checkedVariables = new Set();
        const forLoops = [];

        return {
            SetStatement(node) {
                if (node.target && node.value && isLookupCall(node.value)) {
                    lookupVariables.set(node.target.value.toLowerCase(), node.target);
                }
            },

            AmpIfStatement(node) {
                if (node.condition) {
                    extractRowCountVariables(node.condition, checkedVariables);
                }
            },

            AmpForStatement(node) {
                if (
                    node.endExpr &&
                    isRowCountCall(node.endExpr) &&
                    node.endExpr.arguments &&
                    node.endExpr.arguments.length > 0
                ) {
                    const argument = node.endExpr.arguments[0];
                    if (argument.type === 'Variable') {
                        forLoops.push({
                            varName: argument.value.toLowerCase(),
                            node,
                        });
                    }
                }
            },

            'Program:exit'() {
                for (const loop of forLoops) {
                    if (lookupVariables.has(loop.varName) && !checkedVariables.has(loop.varName)) {
                        context.report({
                            node: loop.node,
                            messageId: 'missingRowCount',
                            data: { name: lookupVariables.get(loop.varName).value },
                        });
                    }
                }
            },
        };
    },
};
