const SMART_QUOTE_RE = /[\u{2018}\u{2019}\u{201C}\u{201D}\u{201A}\u{201E}\u{2039}\u{203A}]/gu;

const SMART_QUOTES = {
    '\u{2018}': 'left single curly quote \u{2018}',
    '\u{2019}': 'right single curly quote \u{2019}',
    '\u{201C}': 'left double curly quote \u{201C}',
    '\u{201D}': 'right double curly quote \u{201D}',
    '\u{201A}': 'single low-9 quote \u{201A}',
    '\u{201E}': 'double low-9 quote \u{201E}',
    '\u{2039}': 'single left angle quote \u{2039}',
    '\u{203A}': 'single right angle quote \u{203A}',
};

// Maps each smart-quote char to its nearest ASCII equivalent.
// Single-flavour smart quotes -> ' ; double-flavour -> "
const SMART_TO_ASCII = {
    '\u{2018}': "'",
    '\u{2019}': "'",
    '\u{201A}': "'",
    '\u{2039}': "'",
    '\u{203A}': "'",
    '\u{201C}': '"',
    '\u{201D}': '"',
    '\u{201E}': '"',
};

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description:
                'Disallow smart/curly quotes in AMPscript (AMPscript requires ASCII quotes)',
            recommended: true,
        },
        messages: {
            smartQuote:
                'String contains {{kind}}. AMPscript only supports straight ASCII quotes (\' or ").',
        },
        schema: [],
    },

    create(context) {
        const sourceCode = context.sourceCode;

        return {
            // The AMPscript parser tokenizes string literals as RAW + IDENTIFIER
            // tokens rather than a StringLiteral node, so a node listener never
            // matches. Scan the virtual .amp region's raw text instead — the whole
            // extracted file is AMPscript, mirroring the LSP smart-quote check.
            Program() {
                const text = sourceCode.getText();
                SMART_QUOTE_RE.lastIndex = 0;
                let match;
                while ((match = SMART_QUOTE_RE.exec(text)) !== null) {
                    const char = match[0];
                    const start = match.index;
                    const end = start + char.length;
                    context.report({
                        loc: {
                            start: sourceCode.getLocFromIndex(start),
                            end: sourceCode.getLocFromIndex(end),
                        },
                        messageId: 'smartQuote',
                        data: { kind: SMART_QUOTES[char] },
                        fix: (fixer) => fixer.replaceTextRange([start, end], SMART_TO_ASCII[char]),
                    });
                }
            },
        };
    },
};
