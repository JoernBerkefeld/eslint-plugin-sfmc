const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const WRAPPED_BLOCK_COMMENT_RE = /^<!--(\/\*[\s\S]*?\*\/)-->$/;

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description:
                'Disallow HTML comment syntax (<!-- ... -->) inside AMPscript regions. Use /* ... */ instead.',
            recommended: true,
        },
        messages: {
            htmlWrappedComment:
                'HTML comment wrapper around an AMPscript comment is not valid. Use /* ... */ directly.',
            htmlComment:
                'HTML comment syntax is not valid inside AMPscript. Use /* ... */ instead.',
        },
        schema: [],
    },

    create(context) {
        return {
            Program() {
                const sourceCode = context.sourceCode;
                const text = sourceCode.getText();

                HTML_COMMENT_RE.lastIndex = 0;
                let match;
                while ((match = HTML_COMMENT_RE.exec(text)) !== null) {
                    const fullMatch = match[0];
                    const start = match.index;
                    const end = start + fullMatch.length;

                    const wrappedMatch = WRAPPED_BLOCK_COMMENT_RE.exec(fullMatch);
                    const isWrapped = wrappedMatch !== null;
                    const innerBlockComment = isWrapped ? wrappedMatch[1] : null;

                    context.report({
                        loc: {
                            start: sourceCode.getLocFromIndex(start),
                            end: sourceCode.getLocFromIndex(end),
                        },
                        messageId: isWrapped ? 'htmlWrappedComment' : 'htmlComment',
                        fix(fixer) {
                            if (isWrapped) {
                                return fixer.replaceTextRange([start, end], innerBlockComment);
                            }
                            const inner = fullMatch.slice(4, -3).trim();
                            return fixer.replaceTextRange([start, end], `/* ${inner} */`);
                        },
                    });
                }
            },
        };
    },
};
