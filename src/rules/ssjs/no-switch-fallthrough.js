/**
 * Rule: no-switch-fallthrough
 *
 * SFMC's SSJS engine has NO switch fall-through. A matched `case` runs only its
 * own statements up to the next `case`/`default` — an empty leading label does
 * not share the next label's body, a break-less body does not cascade into the
 * following case, and a matched case never falls into `default`. Give every
 * clause its own break-terminated body, or use if / a lookup map instead.
 */

// Statement types that stop execution before the next clause, so a body ending
// in one of them is not relying on fall-through.
const TERMINATING_STATEMENTS = new Set([
    'BreakStatement',
    'ReturnStatement',
    'ThrowStatement',
    'ContinueStatement',
]);

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow reliance on switch fall-through because SFMC SSJS never falls through',
        },
        messages: {
            emptyLabelFallthrough:
                'This empty case relies on fall-through into the next label, but SFMC SSJS has no ' +
                'fall-through — the shared body never runs. Give this case its own break-terminated ' +
                'body, or use if / a lookup map.',
            bodyFallthrough:
                'This case body has no terminating break/return/throw, so it relies on cascading ' +
                'into the next case — but SFMC SSJS has no fall-through and each case runs only its ' +
                'own statements. End every case with break, or use if / a lookup map.',
        },
        schema: [],
    },

    create(context) {
        return {
            SwitchStatement(node) {
                const clauses = node.cases;
                for (let index = 0; index < clauses.length; index++) {
                    // The last clause has nothing to fall into, so it is never a problem.
                    if (index === clauses.length - 1) {
                        continue;
                    }
                    const clause = clauses[index];
                    if (clause.consequent.length === 0) {
                        // Empty label stacked before another case/default.
                        context.report({ node: clause, messageId: 'emptyLabelFallthrough' });
                        continue;
                    }
                    // Non-empty body: flag when it does not end in a terminating statement.
                    const last = clause.consequent.at(-1);
                    if (!TERMINATING_STATEMENTS.has(last.type)) {
                        context.report({ node: clause, messageId: 'bodyFallthrough' });
                    }
                }
            },
        };
    },
};
