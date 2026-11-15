/**
 * Combined SFMC processor that extracts AMPscript, SSJS, and Handlebars
 * (Marketing Cloud Next) regions from HTML files.
 *
 * Detects:
 *   1. %%[ ... ]%% blocks (with nesting support) → virtual .amp files
 *   2. %%= ... =%% inline expressions → virtual .amp files
 *   3. <script runat="server" language="ampscript"> → virtual .amp files
 *   4. <script runat="server"> (non-ampscript) → virtual .js files
 *   5. {{ ... }} Handlebars expressions and {!$...} bindings → one virtual .hbs
 *      file holding the whole document with AMPscript regions blanked out
 *   6. %%name%% personalization strings directly followed by [ or = → one
 *      virtual .amp file holding only those strings at their original offsets,
 *      so the AMPscript rule for them can check the text between the regions
 *
 * Returns extracted regions as virtual files for ESLint to lint with the
 * appropriate parser/rules based on file extension matching.
 * Line offsets are preserved so ESLint reports errors at correct locations.
 *
 * MSO / Outlook conditional-comment checks are delegated to
 * eslint-plugin-mso-email: when the document contains MSO markup, that plugin's
 * extractor is called and its virtual blocks are appended verbatim, so a single
 * processor (this one) runs on every HTML file and no processor conflict arises.
 */

import { matchPersonalizationString } from 'ampscript-parser';
import { preprocess as msoPreprocess } from 'eslint-plugin-mso-email/processor';
import { MSO_COMMENT_PATTERN } from 'eslint-plugin-mso-email/comment-pattern';

const AMPSCRIPT_SCRIPT_OPEN_RE =
    /^<script\b(?=[^>]*\brunat\s*=\s*['"]server['"])(?=[^>]*\blanguage\s*=\s*['"]ampscript['"])[^>]*>/i;
const SSJS_SCRIPT_OPEN_RE =
    /<script\b(?=[^>]*\brunat\s*=\s*['"]server['"])(?![^>]*\blanguage\s*=\s*['"]ampscript['"])[^>]*>/gi;
const SCRIPT_CLOSE_G = /<\/script\s*>/gi;

/**
 * AMPscript script tags blanked before the Handlebars parser runs. The
 * %%[ ... ]%% and %%= ... =%% regions are blanked from the offsets found by the
 * delimiter scan in `preprocess`, so both agree on what a region is.
 */
const AMPSCRIPT_SCRIPT_REGION_RE =
    /<script\s[^>]*language\s*=\s*["']ampscript["'][^>]*>[\s\S]*?<\/script>/gi;

function countNewlinesBefore(text, pos) {
    let count = 0;
    for (let index = 0; index < pos; index++) {
        if (text[index] === '\n') {
            count++;
        }
    }
    return count;
}

/**
 * Scans forward for the closing `=%%` of an inline AMPscript expression.
 *
 * @param {string} text - Full document text.
 * @param {number} from - Index to start scanning from (just past the opening `%%=`).
 * @returns {number} Index just past the closing `=%%`, or -1 when not found.
 */
function findInlineExpressionEnd(text, from) {
    for (let index = from; index < text.length; index++) {
        if (text[index] === '=' && text[index + 1] === '%' && text[index + 2] === '%') {
            return index + 3;
        }
    }
    return -1;
}

/**
 * Returns a copy of the document where every AMPscript region is replaced with
 * spaces, preserving newlines and overall offsets. HTML, Handlebars `{{...}}`
 * expressions, and `{!$...}` bindings are kept verbatim so the Handlebars
 * parser can run over a mixed document without choking on AMPscript syntax.
 *
 * Mirrors `getSanitizedHandlebarsText` in sfmc-language-lsp.
 *
 * @param {string} text - Full document text.
 * @param {[number, number][]} delimitedRegions - Start (inclusive) and end
 * (exclusive) offsets of the %%[ ... ]%% and %%= ... =%% regions.
 * @returns {string} Text with AMPscript regions blanked out.
 */
function sanitizeAmpscriptRegions(text, delimitedRegions) {
    const chars = Array.from(text);
    const regions = [...delimitedRegions];
    AMPSCRIPT_SCRIPT_REGION_RE.lastIndex = 0;
    let match;
    while ((match = AMPSCRIPT_SCRIPT_REGION_RE.exec(text)) !== null) {
        regions.push([match.index, match.index + match[0].length]);
    }
    for (const [start, end] of regions) {
        for (let index = start; index < end && index < chars.length; index++) {
            if (chars[index] !== '\n' && chars[index] !== '\r') {
                chars[index] = ' ';
            }
        }
    }
    return chars.join('');
}

/**
 * Returns a copy of the document where everything outside the given regions is
 * replaced with spaces, preserving newlines and overall offsets.
 *
 * @param {string} text - Full document text.
 * @param {[number, number][]} regions - Start (inclusive) and end (exclusive)
 * offsets of the regions to keep.
 * @returns {string} Text with only the given regions left in place.
 */
function keepOnlyRegions(text, regions) {
    let result = '';
    let position = 0;
    for (const [start, end] of regions) {
        result += text.slice(position, start).replaceAll(/[^\n\r]/g, ' ') + text.slice(start, end);
        position = end;
    }
    return result + text.slice(position).replaceAll(/[^\n\r]/g, ' ');
}

export function preprocess(text, filename) {
    const blocks = [];
    let ampCount = 0;
    let ssjsCount = 0;
    const delimitedRegions = [];
    const ambiguousPersonalizations = [];

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
            delimitedRegions.push([blockStart, index]);
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
            const expressionStart = index;
            const expressionEnd = findInlineExpressionEnd(text, index + 3);
            if (expressionEnd === -1) {
                // Unclosed opener: step past it, otherwise the scan never advances.
                index += 3;
                continue;
            }
            index = expressionEnd;
            delimitedRegions.push([expressionStart, index]);
            const innerCode = text.slice(expressionStart + 3, index - 3);
            const wrappedBlock = `%%[${innerCode}]%%`;
            const padding = '\n'.repeat(countNewlinesBefore(text, expressionStart));
            blocks.push({
                text: padding + wrappedBlock,
                filename: `${filename}/ampscript-block-${ampCount++}.amp`,
            });
            continue;
        }

        // %%name%% personalisation string: plain text. Skip it whole so its
        // closing %% is never read as the start of a %%[ / %%= delimiter.
        if (text[index] === '%' && text[index + 1] === '%') {
            const personalizationEnd = matchPersonalizationString(text, index);
            if (personalizationEnd !== -1) {
                if (text[personalizationEnd] === '[' || text[personalizationEnd] === '=') {
                    ambiguousPersonalizations.push([index, personalizationEnd + 1]);
                }
                index = personalizationEnd;
                continue;
            }
        }

        index++;
    }

    // --- Pass 2: extract SSJS regions ---
    const ssjsRegions = [];
    let match;
    SSJS_SCRIPT_OPEN_RE.lastIndex = 0;
    while ((match = SSJS_SCRIPT_OPEN_RE.exec(text)) !== null) {
        const openEnd = match.index + match[0].length;
        SCRIPT_CLOSE_G.lastIndex = openEnd;
        const closeMatch = SCRIPT_CLOSE_G.exec(text);
        if (!closeMatch) {
            break;
        }

        ssjsRegions.push([openEnd, closeMatch.index]);
        const jsCode = text.slice(openEnd, closeMatch.index);
        const linesBefore = text.slice(0, openEnd).split('\n');
        const startLine = linesBefore.length - 1;
        const padding = '\n'.repeat(startLine);

        blocks.push({
            text: padding + jsCode,
            filename: `${filename}/ssjs-block-${ssjsCount++}.js`,
        });
    }

    // --- Pass 3: extract Handlebars (MCN) regions ---
    // Handlebars expressions and {!$...} bindings can appear anywhere in the
    // HTML. The Handlebars parser treats surrounding HTML as content, so we emit
    // the whole document (with AMPscript regions blanked, offsets preserved) as
    // a single virtual .hbs file. Only emit it when the document actually
    // contains Handlebars/binding syntax to avoid paying the parse cost on plain
    // HTML/AMPscript content.
    const sanitizedForHbs = sanitizeAmpscriptRegions(text, delimitedRegions);
    if (sanitizedForHbs.includes('{{') || sanitizedForHbs.includes('{!$')) {
        blocks.push({
            text: sanitizedForHbs,
            filename: `${filename}/handlebars-block-0.hbs`,
        });
    }

    // --- Personalization strings between the AMPscript regions ---
    // AMPscript rules only see the extracted regions. A personalization string
    // directly followed by [ or = sits in the text between them, so those strings
    // (and nothing else — the surrounding HTML is blanked, offsets preserved) are
    // emitted as one more virtual .amp file for
    // sfmc/amp-no-ambiguous-personalization-delimiter. Strings inside server-side
    // JavaScript are left out. Only emitted when such a string exists.
    const reportablePersonalizations = ambiguousPersonalizations.filter(([start]) =>
        ssjsRegions.every(([from, to]) => !(start >= from && start < to)),
    );
    if (reportablePersonalizations.length > 0) {
        blocks.push({
            text: keepOnlyRegions(text, reportablePersonalizations),
            filename: `${filename}/ampscript-personalization.amp`,
        });
    }

    // --- Pass 4: delegate MSO / Outlook conditional-comment extraction ---
    // Only when the document actually contains MSO markup, so plain HTML/AMPscript
    // files don't get an extra full-document virtual block. MSO_COMMENT_PATTERN is
    // a global regex with lastIndex state — reset before testing.
    MSO_COMMENT_PATTERN.lastIndex = 0;
    if (MSO_COMMENT_PATTERN.test(text)) {
        // MSO already preserves line offsets and returns bare virtual basenames
        // (mso-comments.mso, document.msohtml); append verbatim so ESLint routes
        // them to eslint-plugin-mso-email's rule configs via their own globs.
        blocks.push(...msoPreprocess(text, filename));
    }

    return blocks.length === 0 ? [text] : blocks;
}

export function postprocess(messages) {
    return messages.flat();
}

export default { preprocess, postprocess, supportsAutofix: false };
