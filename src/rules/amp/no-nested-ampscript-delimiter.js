// The processor extracts each AMPscript region into its own virtual .amp file,
// including the outer delimiters (%%[...]/%%] or <script>...</script>).
// Any %%[ or %%= found INSIDE the outer delimiters is nested and invalid.
const DELIMITER_RE = /%%\[|%%=/g;
const SCRIPT_TAG_RE = /^[\n]*<script\b/i;
const BLOCK_OPEN_RE = /^[\n]*(%%\[)/;
const INLINE_OPEN_RE = /^[\n]*(%%=)/;
const BLOCK_CLOSE_SUFFIX = ']%%';
const INLINE_CLOSE_SUFFIX = '=%%';

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description:
                'Disallow %%[ or %%= delimiters inside an already-open AMPscript region.',
            recommended: true,
        },
        messages: {
            nestedDelimiterInScript:
                'AMPscript delimiter {{delimiter}} is not needed inside a <script language="ampscript"> block.',
            nestedDelimiter:
                'Nested {{delimiter}} inside an already-open AMPscript block.',
        },
        schema: [],
    },

    create(context) {
        return {
            Program() {
                const sourceCode = context.sourceCode;
                const text = sourceCode.getText();
                const isScriptBlock = SCRIPT_TAG_RE.test(text);

                // For %%[...]%% and %%=...=%% blocks the processor includes the outer
                // delimiters. Record their positions so we can skip the outermost ones.
                let outerOpenStart = -1;
                let outerCloseStart = -1;
                let outerCloseSuffix = BLOCK_CLOSE_SUFFIX;

                if (!isScriptBlock) {
                    const blockOpenMatch = BLOCK_OPEN_RE.exec(text);
                    const inlineOpenMatch = INLINE_OPEN_RE.exec(text);

                    if (blockOpenMatch) {
                        outerOpenStart = blockOpenMatch.index + blockOpenMatch[0].length - 3;
                        outerCloseSuffix = BLOCK_CLOSE_SUFFIX;
                    } else if (inlineOpenMatch) {
                        outerOpenStart = inlineOpenMatch.index + inlineOpenMatch[0].length - 3;
                        outerCloseSuffix = INLINE_CLOSE_SUFFIX;
                    }

                    // The outer close is the last occurrence of the matching close token
                    const lastClose = text.lastIndexOf(outerCloseSuffix);
                    if (lastClose !== -1) {
                        outerCloseStart = lastClose;
                    }
                }

                DELIMITER_RE.lastIndex = 0;
                let match;
                while ((match = DELIMITER_RE.exec(text)) !== null) {
                    const delimiter = match[0];
                    const start = match.index;
                    const end = start + delimiter.length;

                    // Skip the outermost %%[ opener (it is the block wrapper, not nested)
                    if (!isScriptBlock && start === outerOpenStart) continue;

                    const closeToken = delimiter === '%%[' ? ']%%' : '=%%';

                    // Find the matching close token for the fix (first occurrence after this open)
                    let closeIndex = text.indexOf(closeToken, end);
                    // Don't use the outer ]%% as the fix target for an inner %%[
                    if (!isScriptBlock && closeIndex === outerCloseStart) {
                        closeIndex = -1;
                    }

                    context.report({
                        loc: {
                            start: sourceCode.getLocFromIndex(start),
                            end: sourceCode.getLocFromIndex(end),
                        },
                        messageId: isScriptBlock ? 'nestedDelimiterInScript' : 'nestedDelimiter',
                        data: { delimiter },
                        fix:
                            closeIndex === -1
                                ? (fixer) => fixer.removeRange([start, end])
                                : (fixer) => [
                                      fixer.removeRange([
                                          closeIndex,
                                          closeIndex + closeToken.length,
                                      ]),
                                      fixer.removeRange([start, end]),
                                  ],
                    });
                }
            },
        };
    },
};
