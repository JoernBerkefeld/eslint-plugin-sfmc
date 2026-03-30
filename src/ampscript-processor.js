/**
 * ESLint processor that extracts AMPscript regions from HTML files.
 *
 * Detects:
 *   1. %%[ ... ]%% blocks (with nesting support)
 *   2. %%= ... =%% inline expressions
 *   3. <script runat="server" language="ampscript"> ... </script> tags
 *
 * Returns extracted regions as virtual .amp files for the AMPscript parser.
 * Line offsets are preserved so ESLint reports errors at correct locations.
 */

const SCRIPT_OPEN_RE =
    /^<script\b(?=[^>]*\brunat\s*=\s*['"]server['"])(?=[^>]*\blanguage\s*=\s*['"]ampscript['"])[^>]*>/i;
const SCRIPT_CLOSE_G = /<\/script\s*>/gi;

function countNewlinesBefore(text, pos) {
    let count = 0;
    for (let index = 0; index < pos; index++) {
        if (text[index] === '\n') count++;
    }
    return count;
}

export function preprocess(text, filename) {
    const blocks = [];
    let index = 0;

    while (index < text.length) {
        // <script runat="server" language="ampscript"> ... </script>
        if (text[index] === '<') {
            const openMatch = SCRIPT_OPEN_RE.exec(text.slice(index));
            if (openMatch) {
                const openTagEnd = index + openMatch[0].length;

                SCRIPT_CLOSE_G.lastIndex = openTagEnd;
                const closeMatch = SCRIPT_CLOSE_G.exec(text);
                if (closeMatch) {
                    const blockEnd = closeMatch.index + closeMatch[0].length;
                    const fullBlock = text.slice(index, blockEnd);
                    const padding = '\n'.repeat(countNewlinesBefore(text, index));

                    blocks.push({
                        text: padding + fullBlock,
                        filename: `${filename}/ampscript-block-${blocks.length}.amp`,
                    });

                    index = blockEnd;
                    continue;
                }
            }
        }

        // %%[ ... ]%%
        if (text[index] === '%' && text[index + 1] === '%' && text[index + 2] === '[') {
            const blockStart = index;
            index += 3;
            let depth = 1;

            while (index < text.length && depth > 0) {
                if (text[index] === '%' && text[index + 1] === '%' && text[index + 2] === '[') {
                    depth++;
                    index += 3;
                } else if (
                    text[index] === ']' &&
                    text[index + 1] === '%' &&
                    text[index + 2] === '%'
                ) {
                    depth--;
                    index += 3;
                } else {
                    index++;
                }
            }

            if (depth !== 0) continue;

            const fullBlock = text.slice(blockStart, index);
            const padding = '\n'.repeat(countNewlinesBefore(text, blockStart));

            blocks.push({
                text: padding + fullBlock,
                filename: `${filename}/ampscript-block-${blocks.length}.amp`,
            });
            continue;
        }

        // %%= ... =%%
        if (text[index] === '%' && text[index + 1] === '%' && text[index + 2] === '=') {
            const exprStart = index;
            index += 3;
            let found = false;

            while (index < text.length) {
                if (text[index] === '=' && text[index + 1] === '%' && text[index + 2] === '%') {
                    index += 3;
                    found = true;
                    break;
                }
                index++;
            }

            if (!found) continue;

            // Wrap in %%[ ]%% so the AMPscript parser receives valid block syntax.
            // %%[ is 3 chars, same as %%= — column offsets for inner code are preserved.
            const innerCode = text.slice(exprStart + 3, index - 3);
            const wrappedBlock = `%%[${innerCode}]%%`;
            const padding = '\n'.repeat(countNewlinesBefore(text, exprStart));

            blocks.push({
                text: padding + wrappedBlock,
                filename: `${filename}/ampscript-block-${blocks.length}.amp`,
            });
            continue;
        }

        index++;
    }

    if (blocks.length === 0) {
        return [text];
    }

    return blocks;
}

export function postprocess(messages) {
    return messages.flat();
}

export default { preprocess, postprocess, supportsAutofix: false };
