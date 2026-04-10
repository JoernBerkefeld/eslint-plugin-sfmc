/**
 * Combined SFMC processor that extracts both AMPscript and SSJS regions
 * from HTML files.
 *
 * Detects:
 *   1. %%[ ... ]%% blocks (with nesting support) → virtual .amp files
 *   2. %%= ... =%% inline expressions → virtual .amp files
 *   3. <script runat="server" language="ampscript"> → virtual .amp files
 *   4. <script runat="server"> (non-ampscript) → virtual .js files
 *
 * Returns extracted regions as virtual files for ESLint to lint with the
 * appropriate parser/rules based on file extension matching.
 * Line offsets are preserved so ESLint reports errors at correct locations.
 */

const AMPSCRIPT_SCRIPT_OPEN_RE =
    /^<script\b(?=[^>]*\brunat\s*=\s*['"]server['"])(?=[^>]*\blanguage\s*=\s*['"]ampscript['"])[^>]*>/i;
const SSJS_SCRIPT_OPEN_RE =
    /<script\b(?=[^>]*\brunat\s*=\s*['"]server['"])(?![^>]*\blanguage\s*=\s*['"]ampscript['"])[^>]*>/gi;
const SCRIPT_CLOSE_G = /<\/script\s*>/gi;

function countNewlinesBefore(text, pos) {
    let count = 0;
    for (let index = 0; index < pos; index++) {
        if (text[index] === '\n') {
            count++;
        }
    }
    return count;
}

export function preprocess(text, filename) {
    const blocks = [];
    let ampCount = 0;
    let ssjsCount = 0;

    // --- Pass 1: extract AMPscript regions ---
    let index = 0;
    while (index < text.length) {
        // <script runat="server" language="ampscript"> ... </script>
        if (text[index] === '<') {
            const openMatch = AMPSCRIPT_SCRIPT_OPEN_RE.exec(text.slice(index));
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
                        filename: `${filename}/ampscript-block-${ampCount++}.amp`,
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
            if (depth !== 0) {
                continue;
            }
            const fullBlock = text.slice(blockStart, index);
            const padding = '\n'.repeat(countNewlinesBefore(text, blockStart));
            blocks.push({
                text: padding + fullBlock,
                filename: `${filename}/ampscript-block-${ampCount++}.amp`,
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
            if (!found) {
                continue;
            }
            const innerCode = text.slice(exprStart + 3, index - 3);
            const wrappedBlock = `%%[${innerCode}]%%`;
            const padding = '\n'.repeat(countNewlinesBefore(text, exprStart));
            blocks.push({
                text: padding + wrappedBlock,
                filename: `${filename}/ampscript-block-${ampCount++}.amp`,
            });
            continue;
        }

        index++;
    }

    // --- Pass 2: extract SSJS regions ---
    let match;
    SSJS_SCRIPT_OPEN_RE.lastIndex = 0;
    while ((match = SSJS_SCRIPT_OPEN_RE.exec(text)) !== null) {
        const openEnd = match.index + match[0].length;
        SCRIPT_CLOSE_G.lastIndex = openEnd;
        const closeMatch = SCRIPT_CLOSE_G.exec(text);
        if (!closeMatch) {
            break;
        }

        const jsCode = text.slice(openEnd, closeMatch.index);
        const linesBefore = text.slice(0, openEnd).split('\n');
        const startLine = linesBefore.length - 1;
        const padding = '\n'.repeat(startLine);

        blocks.push({
            text: padding + jsCode,
            filename: `${filename}/ssjs-block-${ssjsCount++}.js`,
        });
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
