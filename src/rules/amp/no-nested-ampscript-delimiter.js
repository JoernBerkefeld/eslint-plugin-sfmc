import { matchPersonalizationString } from 'ampscript-parser';

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
const SCRIPT_CLOSE_RE = /<\/script\s*>/i;

const OPEN_TOKENS = new Set(['%%[', '%%=']);
const CLOSE_FOR_OPEN = { '%%[': ']%%', '%%=': '=%%' };

/**
 * Finds every %%[ / %%= opener that sits inside an already-open region.
 *
 * Outside any region a %%name%% personalisation string is plain text and is
 * skipped whole, so its closing %% is never read as the start of an opener and
 * closers are not looked for. Inside a region openers and closers are matched
 * in document order.
 *
 * @param {string} text - Source text of the file or virtual block.
 * @param {number} [from] - Offset to start scanning at.
 * @returns {{delimiter: string, start: number}[]} Nested openers.
 */
function findNestedOpeners(text, from = 0) {
    const nested = [];
    let depth = 0;
    let index = from;
    while (index < text.length) {
        if (text.startsWith('%%', index)) {
            const delimiter = text.slice(index, index + 3);
            if (OPEN_TOKENS.has(delimiter)) {
                if (depth > 0) {
                    nested.push({ delimiter, start: index });
                }
                depth++;
                index += 3;
                continue;
            }
            if (depth === 0) {
                const personalizationEnd = matchPersonalizationString(text, index);
                if (personalizationEnd !== -1) {
                    index = personalizationEnd;
                    continue;
                }
            }
        } else if (depth > 0 && (text.startsWith(']%%', index) || text.startsWith('=%%', index))) {
            depth--;
            index += 3;
            continue;
        }
        index++;
    }
    return nested;
}

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

        const reportNested = (text, delimiter, start, isScriptBlock) => {
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

                let scriptEnd = 0;
                if (isScriptBlock) {
                    // Inside a <script language="ampscript"> block the whole body is
                    // already AMPscript; every %%[ / %%= delimiter is redundant.
                    // The block ends at the first </script>; what follows is
                    // ordinary template content again.
                    const scriptClose = SCRIPT_CLOSE_RE.exec(text);
                    scriptEnd = scriptClose ? scriptClose.index : text.length;
                    const scriptText = text.slice(0, scriptEnd);
                    TOKEN_RE.lastIndex = 0;
                    let match;
                    while ((match = TOKEN_RE.exec(scriptText)) !== null) {
                        if (OPEN_TOKENS.has(match[0])) {
                            reportNested(scriptText, match[0], match.index, true);
                        }
                    }
                }

                // Depth-based scan for raw %%[...]%% / %%=...=%% content. Sibling blocks
                // return depth to 0 between them, so their openers are not flagged.
                for (const { delimiter, start } of findNestedOpeners(text, scriptEnd)) {
                    reportNested(text, delimiter, start, false);
                }
            },
        };
    },
};
