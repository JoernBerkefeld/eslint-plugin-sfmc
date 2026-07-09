// The processor extracts each AMPscript region into its own virtual .amp file,
// including the outer delimiters (%%[...]/%%] or <script>...</script>).
// Any %%[ or %%= found INSIDE an already-open block is nested and invalid.
//
// A raw .amp file may contain several *sibling* blocks (e.g. one %%[...]%% block
// followed by another). Those are not nested. To distinguish nesting from
// siblings we scan every open/close token in document order and track depth:
// an opener is only nested when depth > 0.
const TOKEN_RE = /%%\[|%%=|\]%%|=%%/g;
const SCRIPT_TAG_RE = /^[\n]*<script\b/i;

const OPEN_TOKENS = new Set(['%%[', '%%=']);
const CLOSE_FOR_OPEN = { '%%[': ']%%', '%%=': '=%%' };

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description: 'Disallow %%[ or %%= delimiters inside an already-open AMPscript region.',
            recommended: true,
        },
        messages: {
            nestedDelimiterInScript:
                'AMPscript delimiter {{delimiter}} is not needed inside a <script language="ampscript"> block.',
            nestedDelimiter: 'Nested {{delimiter}} inside an already-open AMPscript block.',
        },
        schema: [],
    },

    create(context) {
        const sourceCode = context.sourceCode;

        const reportNested = (text, match, isScriptBlock) => {
            const delimiter = match[0];
            const start = match.index;
            const end = start + delimiter.length;
            const closeToken = CLOSE_FOR_OPEN[delimiter];
            const closeIndex = text.indexOf(closeToken, end);

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
                              fixer.removeRange([closeIndex, closeIndex + closeToken.length]),
                              fixer.removeRange([start, end]),
                          ],
            });
        };

        return {
            Program() {
                const text = sourceCode.getText();
                const isScriptBlock = SCRIPT_TAG_RE.test(text);

                if (isScriptBlock) {
                    // Inside a <script language="ampscript"> block the whole body is
                    // already AMPscript; every %%[ / %%= delimiter is redundant.
                    TOKEN_RE.lastIndex = 0;
                    let match;
                    while ((match = TOKEN_RE.exec(text)) !== null) {
                        if (OPEN_TOKENS.has(match[0])) {
                            reportNested(text, match, true);
                        }
                    }
                    return;
                }

                // Depth-based scan for raw %%[...]%% / %%=...=%% content. Sibling blocks
                // return depth to 0 between them, so their openers are not flagged.
                let depth = 0;
                TOKEN_RE.lastIndex = 0;
                let match;
                while ((match = TOKEN_RE.exec(text)) !== null) {
                    if (OPEN_TOKENS.has(match[0])) {
                        if (depth > 0) {
                            reportNested(text, match, false);
                        }
                        depth++;
                    } else {
                        depth = Math.max(0, depth - 1);
                    }
                }
            },
        };
    },
};
