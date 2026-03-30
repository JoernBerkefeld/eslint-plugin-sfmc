/**
 * Rule: no-treatascontent-injection
 *
 * Flags string concatenation inside TreatAsContent() calls. When dynamic
 * values are concatenated into the AMPscript string, an attacker (or
 * unexpected data) can inject arbitrary AMPscript code.
 *
 * Safe pattern: use Variable.SetValue() to pass values into AMPscript
 * variables, then reference those variables inside TreatAsContent().
 */

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow string concatenation in TreatAsContent() to prevent AMPscript injection',
        },
        messages: {
            injection:
                'Concatenating dynamic values into TreatAsContent() risks AMPscript injection. ' +
                "Use Variable.SetValue() to pass values into AMPscript variables, then reference " +
                "them with @varName inside the TreatAsContent string.",
        },
        schema: [],
    },

    create(context) {
        return {
            CallExpression(node) {
                if (!isTreatAsContentCall(node)) return;
                if (node.arguments.length === 0) return;

                const arg = node.arguments[0];
                if (containsConcatenation(arg)) {
                    context.report({ node: arg, messageId: 'injection' });
                }
            },
        };
    },
};

function isTreatAsContentCall(node) {
    const callee = node.callee;

    // TreatAsContent(...)
    if (callee.type === 'Identifier' && callee.name === 'TreatAsContent') {
        return true;
    }

    // Platform.Function.TreatAsContent(...)
    if (
        callee.type === 'MemberExpression' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'TreatAsContent' &&
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

function containsConcatenation(node) {
    if (node.type === 'BinaryExpression' && node.operator === '+') {
        return true;
    }
    if (node.type === 'TemplateLiteral' && node.expressions.length > 0) {
        return true;
    }
    return false;
}
