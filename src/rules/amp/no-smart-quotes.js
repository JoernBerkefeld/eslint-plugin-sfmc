const SMART_QUOTE_RE = /[\u2018\u2019\u201C\u201D\u201A\u201E\u2039\u203A]/;

const SMART_QUOTES = {
    '\u2018': 'left single curly quote \u2018',
    '\u2019': 'right single curly quote \u2019',
    '\u201C': 'left double curly quote \u201C',
    '\u201D': 'right double curly quote \u201D',
    '\u201A': 'single low-9 quote \u201A',
    '\u201E': 'double low-9 quote \u201E',
    '\u2039': 'single left angle quote \u2039',
    '\u203A': 'single right angle quote \u203A',
};

// Maps each smart-quote char to its nearest ASCII equivalent.
// Single-flavour smart quotes -> ' ; double-flavour -> "
const SMART_TO_ASCII = {
    '\u2018': "'",
    '\u2019': "'",
    '\u201A': "'",
    '\u2039': "'",
    '\u203A': "'",
    '\u201C': '"',
    '\u201D': '"',
    '\u201E': '"',
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
                                    const fixed = node.value.replace(
                                        /[\u2018\u2019\u201C\u201D\u201A\u201E\u2039\u203A]/g,
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
