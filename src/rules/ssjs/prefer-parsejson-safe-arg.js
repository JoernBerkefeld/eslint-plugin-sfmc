/**
 * Rule: prefer-parsejson-safe-arg
 *
 * Platform.Function.ParseJSON() throws a 500 if the argument is undefined or
 * not a string. Concatenating an empty string (someVar + '') is a common SFMC
 * pattern to guard against this.
 *
 * Auto-fix: wraps the argument with `(arg + '')`.
 */

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description:
                "Require concatenating an empty string to Platform.Function.ParseJSON() arguments to prevent 500 errors",
        },
        messages: {
            unsafeArg:
                "Platform.Function.ParseJSON() may throw a 500 if the argument is undefined. " +
                "Concatenate an empty string to be safe: ParseJSON({{argText}} + '').",
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                if (!isParseJSONCall(node)) return;
                if (node.arguments.length === 0) return;

                const arg = node.arguments[0];

                if (isAlreadySafe(arg)) return;

                context.report({
                    node: arg,
                    messageId: 'unsafeArg',
                    data: { argText: context.sourceCode.getText(arg) },
                    fix(fixer) {
                        const argText = context.sourceCode.getText(arg);
                        return fixer.replaceText(arg, `${argText} + ''`);
                    },
                });
            },
        };
    },
};

function isParseJSONCall(node) {
    const callee = node.callee;

    // ParseJSON(...)
    if (callee.type === 'Identifier' && callee.name === 'ParseJSON') {
        return true;
    }

    // Platform.Function.ParseJSON(...)
    if (
        callee.type === 'MemberExpression' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'ParseJSON' &&
        callee.object.type === 'MemberExpression' &&
        callee.object.property.type === 'Identifier' &&
        callee.object.property.name === 'Function' &&
        callee.object.object.type === 'Identifier' &&
        callee.object.object.name === 'Platform'
    ) {
        return true;
    }

    return false;
}

function isAlreadySafe(arg) {
    // arg + ''  or  '' + arg
    if (arg.type === 'BinaryExpression' && arg.operator === '+') {
        if (isEmptyString(arg.left) || isEmptyString(arg.right)) {
            return true;
        }
    }

    // String literal passed directly — already a string
    if (arg.type === 'Literal' && typeof arg.value === 'string') {
        return true;
    }

    return false;
}

function isEmptyString(node) {
    return node.type === 'Literal' && node.value === '';
}
