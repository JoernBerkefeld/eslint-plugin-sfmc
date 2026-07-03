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
                'Require concatenating an empty string to Platform.Function.ParseJSON() arguments to prevent 500 errors',
        },
        messages: {
            unsafeArg:
                'Platform.Function.ParseJSON() may throw a 500 if the argument is undefined. ' +
                "Concatenate an empty string to be safe: ParseJSON({{argText}} + '').",
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                if (!isParseJSONCall(node)) {
                    return;
                }
                if (node.arguments.length === 0) {
                    return;
                }

                const argument = node.arguments[0];

                if (isAlreadySafe(argument)) {
                    return;
                }

                context.report({
                    node: argument,
                    messageId: 'unsafeArg',
                    data: { argText: context.sourceCode.getText(argument) },
                    fix(fixer) {
                        const argumentText = context.sourceCode.getText(argument);
                        return fixer.replaceText(argument, `${argumentText} + ''`);
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
    return (
        callee.type === 'MemberExpression' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'ParseJSON' &&
        callee.object.type === 'MemberExpression' &&
        callee.object.property.type === 'Identifier' &&
        callee.object.property.name === 'Function' &&
        callee.object.object.type === 'Identifier' &&
        callee.object.object.name === 'Platform'
    );
}

function isAlreadySafe(argument) {
    // arg + ''  or  '' + arg
    if (
        argument.type === 'BinaryExpression' &&
        argument.operator === '+' &&
        (isEmptyString(argument.left) || isEmptyString(argument.right))
    ) {
        return true;
    }

    // String literal passed directly — already a string
    return argument.type === 'Literal' && typeof argument.value === 'string';
}

function isEmptyString(node) {
    return node.type === 'Literal' && node.value === '';
}
