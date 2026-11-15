import { matchPersonalizationString } from 'ampscript-parser';
import { isSystemPersonalizationString } from 'ampscript-data';

// Marketing Cloud replaces a personalization string whose name resolves BEFORE
// AMPscript is parsed. When its closing %% is directly followed by [ or =, the
// two only form a %%[ / %%= delimiter if the name does NOT resolve. Whether a
// non-system name resolves depends on the account and the send context, so the
// construct is reported and the author is asked to separate the two.
//
// Personalization strings live in the template text outside AMPscript regions,
// i.e. in the top-level Content nodes. Server-side JavaScript bodies are part of
// that text for the AMPscript parser and are skipped here.
const SSJS_SCRIPT_OPEN_RE = /<script\b(?=[^>]*\brunat\s*=\s*['"]server['"])[^>]*>/iy;
const SCRIPT_CLOSE_RE = /<\/script\s*>/gi;

const FOLLOWING_CHARACTERS = new Set(['[', '=']);

/**
 * Finds the end of a server-side script block that opens at `index`.
 *
 * @param {string} text - Full source text.
 * @param {number} index - Offset of a `<` character.
 * @returns {number} Offset just past the closing script tag (or the end of the
 * text when it is not closed), or -1 when no server-side script opens here.
 */
function matchServerScript(text, index) {
    SSJS_SCRIPT_OPEN_RE.lastIndex = index;
    if (!SSJS_SCRIPT_OPEN_RE.test(text)) {
        return -1;
    }
    SCRIPT_CLOSE_RE.lastIndex = SSJS_SCRIPT_OPEN_RE.lastIndex;
    return SCRIPT_CLOSE_RE.test(text) ? SCRIPT_CLOSE_RE.lastIndex : text.length;
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow a personalization string directly followed by [ or =, which may or may not form an AMPscript delimiter.',
            recommended: true,
        },
        messages: {
            systemString:
                'Personalization string {{string}} is replaced before AMPscript is parsed, so the "%%{{character}}" it forms with the following "{{character}}" does not start AMPscript and the text after it is output as written. Add a space or another character in between if literal text is intended, or move the AMPscript away from the string.',
            unknownName:
                'Whether the "%%{{character}}" formed by {{string}} and the following "{{character}}" starts AMPscript depends on whether Marketing Cloud can resolve the name where the content runs (attribute or sendable data extension field in a send; often not on a CloudPage): if it resolves, what follows is plain text. Add a space or another character in between to make the result predictable.',
        },
        schema: [],
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            Program(node) {
                const text = sourceCode.getText();

                for (const child of node.body) {
                    if (child.type !== 'Content') {
                        continue;
                    }
                    const [contentStart, contentEnd] = child.range;
                    let index = contentStart;
                    while (index < contentEnd) {
                        if (text[index] === '<') {
                            const scriptEnd = matchServerScript(text, index);
                            if (scriptEnd !== -1) {
                                index = scriptEnd;
                                continue;
                            }
                        } else if (text.startsWith('%%', index)) {
                            const end = matchPersonalizationString(text, index);
                            if (end !== -1) {
                                const character = text[end];
                                if (FOLLOWING_CHARACTERS.has(character)) {
                                    const name = text.slice(index + 2, end - 2);
                                    context.report({
                                        loc: {
                                            start: sourceCode.getLocFromIndex(index),
                                            end: sourceCode.getLocFromIndex(end + 1),
                                        },
                                        messageId: isSystemPersonalizationString(name)
                                            ? 'systemString'
                                            : 'unknownName',
                                        data: { string: text.slice(index, end), character },
                                    });
                                }
                                index = end;
                                continue;
                            }
                        }
                        index++;
                    }
                }
            },
        };
    },
};
