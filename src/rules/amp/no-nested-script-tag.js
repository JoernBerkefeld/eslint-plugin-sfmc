// The processor extracts each <script language="ampscript">...</script> block
// as a virtual .amp file, including the opening tag in the emitted text.
// Therefore, scanning the virtual source for a *second* opening tag catches
// the case where a developer forgot a closing </script> and started a new block.
const SCRIPT_OPEN_RE =
    /<script\b(?=[^>]*\brunat\s*=\s*['"]server['"])(?=[^>]*\blanguage\s*=\s*['"]ampscript['"])[^>]*>/gi;

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description:
                'Disallow nested <script language="ampscript"> tags inside an already-open AMPscript script block.',
            recommended: true,
        },
        messages: {
            nestedScriptTag:
                'Nested <script language="ampscript"> inside an already-open AMPscript block. Did you forget a </script> closing tag?',
        },
        schema: [],
    },

    create(context) {
        return {
            Program() {
                const sourceCode = context.sourceCode;
                const text = sourceCode.getText();

                // Only relevant when the virtual block starts with a <script> tag.
                // %%[...]%% blocks cannot contain a nested <script> opening tag in
                // a way the processor would expose, so skip non-script-tag blocks.
                SCRIPT_OPEN_RE.lastIndex = 0;
                if (!SCRIPT_OPEN_RE.test(text)) return;

                // Reset and find all script open tags in this virtual block.
                SCRIPT_OPEN_RE.lastIndex = 0;
                const openTags = [];
                let match;
                while ((match = SCRIPT_OPEN_RE.exec(text)) !== null) {
                    openTags.push({ index: match.index, length: match[0].length });
                }

                // The first tag is the expected outer opener.
                // Any tag beyond the first is nested (invalid).
                for (let index = 1; index < openTags.length; index++) {
                    const tag = openTags[index];
                    const start = tag.index;
                    const end = start + tag.length;

                    context.report({
                        loc: {
                            start: sourceCode.getLocFromIndex(start),
                            end: sourceCode.getLocFromIndex(end),
                        },
                        messageId: 'nestedScriptTag',
                        fix(fixer) {
                            return fixer.replaceTextRange([start, start], '</script>\n');
                        },
                    });
                }
            },
        };
    },
};
