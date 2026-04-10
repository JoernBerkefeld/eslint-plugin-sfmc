/**
 * ESLint processor that extracts SSJS blocks from HTML/AMPscript files.
 *
 * Detects <script runat="server"> blocks (without language="ampscript")
 * and returns them as JavaScript code blocks for ESLint to lint.
 * Line offsets are preserved so ESLint reports errors at correct locations.
 */

const SCRIPT_OPEN_RE =
    /<script\b(?=[^>]*\brunat\s*=\s*['"]server['"])(?![^>]*\blanguage\s*=\s*['"]ampscript['"])[^>]*>/gi;
const SCRIPT_CLOSE_RE = /<\/script\s*>/gi;

export function preprocess(text, filename) {
    const blocks = [];
    let match;

    SCRIPT_OPEN_RE.lastIndex = 0;
    while ((match = SCRIPT_OPEN_RE.exec(text)) !== null) {
        const openEnd = match.index + match[0].length;

        SCRIPT_CLOSE_RE.lastIndex = openEnd;
        const closeMatch = SCRIPT_CLOSE_RE.exec(text);
        if (!closeMatch) {
            break;
        }

        const jsCode = text.slice(openEnd, closeMatch.index);

        const linesBefore = text.slice(0, openEnd).split('\n');
        const startLine = linesBefore.length - 1;
        const padding = '\n'.repeat(startLine);

        blocks.push({
            text: padding + jsCode,
            filename: `${filename}/ssjs-block-${blocks.length}.js`,
        });
    }

    if (blocks.length === 0) {
        return [text];
    }

    return blocks;
}

export function postprocess(messages, _filename) {
    return messages.flat();
}

export default { preprocess, postprocess, supportsAutofix: false };
