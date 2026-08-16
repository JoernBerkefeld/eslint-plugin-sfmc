/**
 * Rule: no-switch-default
 *
 * SFMC's SSJS runs on an old Jint build affected by jint#2607: an executed
 * `break` inside a `switch` that sits inside a function can abnormally complete
 * the function, so it returns `undefined` and statements after the `switch` are
 * skipped (intermittent across compilations). Community lore mis-reported this
 * as "the `default` case may not execute", but a last-clause `default` itself
 * runs fine — the trigger is the executed `break`.
 *
 * Flagging the `default` clause is a cheap heuristic hint to avoid relying on a
 * function-scoped `switch`/`break` for critical control flow. Prefer a lookup
 * map or `if`/`else if`.
 */

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                "Discourage relying on a 'default' case in switch statements: a function-scoped switch/break can abnormally complete the function in SFMC SSJS (Jint bug)",
        },
        messages: {
            noDefault:
                'A `break` inside a function-scoped `switch` can abnormally complete the ' +
                'function in SFMC SSJS (Jint bug), skipping code after the `switch` — often ' +
                'the `default` fallback. Prefer a lookup map or `if`/`else if` for critical ' +
                'control flow.',
        },
        schema: [],
    },

    create(context) {
        return {
            SwitchCase(node) {
                if (node.test === null) {
                    context.report({ node, messageId: 'noDefault' });
                }
            },
        };
    },
};
