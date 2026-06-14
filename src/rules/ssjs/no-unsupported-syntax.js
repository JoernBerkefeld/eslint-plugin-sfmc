/**
 * Rule: no-unsupported-syntax
 *
 * Flags ES6+ syntax features that are not supported by SFMC's legacy
 * ECMAScript engine. These features cause runtime errors in SFMC.
 *
 * Auto-fix:
 *   - let/const declarations → var
 *   - nullish coalescing (??) → || (semantics differ for 0, '', false)
 *   - direct object literal return → extract to variable
 */

import { unsupportedByNodeType } from 'ssjs-data';

const AUTO_FIX = {
    LetDeclaration: (node) => (fixer) =>
        fixer.replaceTextRange([node.range[0], node.range[0] + 3], 'var'),
    ConstDeclaration: (node) => (fixer) =>
        fixer.replaceTextRange([node.range[0], node.range[0] + 5], 'var'),
};

function nullishCoalescingFix(context, node) {
    return (fixer) => {
        const src = context.sourceCode.getText();
        const between = src.slice(node.left.range[1], node.right.range[0]);
        const offset = between.indexOf('??');
        if (offset === -1) {
            return null;
        }
        const start = node.left.range[1] + offset;
        return fixer.replaceTextRange([start, start + 2], '||');
    };
}

function directObjectReturnFix(context, node) {
    return (fixer) => {
        const objText = context.sourceCode.getText(node.argument);
        const indent = ' '.repeat(node.loc.start.column);
        return fixer.replaceText(node, `var _result = ${objText};\n${indent}return _result;`);
    };
}

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description: 'Disallow ES6+ syntax features not supported by the SFMC SSJS engine',
        },
        messages: {
            unsupported: '{{label}} are not supported in SFMC SSJS. {{suggestion}}',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    allow: {
                        type: 'array',
                        items: { type: 'string' },
                        uniqueItems: true,
                        description:
                            "Feature names to allow (e.g. ['LetDeclaration', 'ConstDeclaration']).",
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] || {};
        const allowed = new Set(options.allow || []);

        const listeners = {};

        for (const [nodeType, entries] of unsupportedByNodeType) {
            listeners[nodeType] = function (node) {
                for (const entry of entries) {
                    if (allowed.has(entry.feature)) {
                        continue;
                    }
                    if (entry.test && !entry.test(node)) {
                        continue;
                    }

                    const report = {
                        node,
                        messageId: 'unsupported',
                        data: {
                            label: entry.label,
                            suggestion: entry.suggestion,
                        },
                    };

                    if (entry.feature in AUTO_FIX) {
                        report.fix = AUTO_FIX[entry.feature](node);
                    } else if (entry.feature === 'NullishCoalescing') {
                        report.fix = nullishCoalescingFix(context, node);
                    } else if (entry.feature === 'DirectObjectReturn') {
                        report.fix = directObjectReturnFix(context, node);
                    }

                    context.report(report);
                }
            };
        }

        return listeners;
    },
};
