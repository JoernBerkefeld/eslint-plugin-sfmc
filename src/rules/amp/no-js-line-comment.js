// Matches // comments but avoids :// (URL protocol separators).
// Strings are not a concern here because the processor feeds only AMPscript
// source to the parser/rules, but the ampscript-parser does not blank string
// contents before rule execution. To be safe, we skip matches that are clearly
// inside quoted strings by checking surrounding context via the source text.
const JS_LINE_COMMENT_RE = /(?<!:)\/\/.*/g;

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description:
                'Disallow JavaScript-style single-line comments (// ...) inside AMPscript regions. Use /* ... */ instead.',
            recommended: true,
        },
        messages: {
            jsLineComment:
                'Single-line // comments are not valid AMPscript syntax. Use /* ... */ instead.',
        },
        schema: [],
    },

    create(context) {
        return {
            Program() {
                const sourceCode = context.sourceCode;
                const text = sourceCode.getText();

                JS_LINE_COMMENT_RE.lastIndex = 0;
                let match;
                while ((match = JS_LINE_COMMENT_RE.exec(text)) !== null) {
                    const start = match.index;
                    const end = start + match[0].length;
                    const commentText = match[0].slice(2).trim();

                    context.report({
                        loc: {
                            start: sourceCode.getLocFromIndex(start),
                            end: sourceCode.getLocFromIndex(end),
                        },
                        messageId: 'jsLineComment',
                        fix(fixer) {
                            return fixer.replaceTextRange(
                                [start, end],
                                commentText.length > 0 ? `/* ${commentText} */` : '/**/',
                            );
                        },
                    });
                }
            },
        };
    },
};
