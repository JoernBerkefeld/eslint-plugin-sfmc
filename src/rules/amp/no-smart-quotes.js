const SMART_QUOTE_RE = /[\u{2018}\u{2019}\u{201C}\u{201D}\u{201A}\u{201E}\u{2039}\u{203A}]/u;

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
                'Disallow smart/curly quotes in string literals (AMPscript requires ASCII quotes)',
            recommended: true,
        },
        messages: {
            smartQuote:
                'String contains {{kind}}. AMPscript only supports straight ASCII quotes (\' or ").',
        },
        schema: [],
    },

    create(context) {
        return {
            StringLiteral(node) {
                if (SMART_QUOTE_RE.test(node.value)) {
                    for (const [char, kind] of Object.entries(SMART_QUOTES)) {
                        if (node.value.includes(char)) {
                            context.report({
                                node,
                                messageId: 'smartQuote',
                                data: { kind },
                                fix(fixer) {
                                    const fixed = node.value.replaceAll(
                                        /[\u{2018}\u{2019}\u{201C}\u{201D}\u{201A}\u{201E}\u{2039}\u{203A}]/gu,
                                        (c) => SMART_TO_ASCII[c],
                                    );
                                    const q = node.quote;
                                    // If the replacement introduces the outer delimiter, try switching quotes.
                                    if (fixed.includes(q)) {
                                        const other = q === '"' ? "'" : '"';
                                        if (!fixed.includes(other)) {
                                            return fixer.replaceText(node, other + fixed + other);
                                        }
                                        // Both quote chars present — cannot safely auto-fix.
                                        return null;
                                    }
                                    return fixer.replaceText(node, q + fixed + q);
                                },
                            });
                            return;
                        }
                    }
                }
            },
        };
    },
};
