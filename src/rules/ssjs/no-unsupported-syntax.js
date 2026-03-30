/**
 * Rule: no-unsupported-syntax
 *
 * Flags ES6+ syntax features that are not supported by SFMC's legacy
 * ECMAScript engine. These features cause runtime errors in SFMC.
 *
 * Auto-fix: let/const declarations are rewritten to var (safe, 1:1 swap per
 * Mateusz Dąbrowski's SSJS style guide).
 *
 * Suggestions:
 *   - nullish coalescing (??) → replace with ||
 *   - direct object literal return → extract to variable
 */

import { unsupportedByNodeType } from 'ssjs-data';

// Features that can be safely auto-fixed without changing semantics.
const AUTO_FIX = {
    LetDeclaration: (node) => (fixer) =>
        // "let" is 3 chars; the keyword starts at node.range[0].
        fixer.replaceTextRange([node.range[0], node.range[0] + 3], 'var'),
    ConstDeclaration: (node) => (fixer) =>
        // "const" is 5 chars.
        fixer.replaceTextRange([node.range[0], node.range[0] + 5], 'var'),
};

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        hasSuggestions: true,
        docs: {
            description: 'Disallow ES6+ syntax features not supported by the SFMC SSJS engine',
        },
        messages: {
            unsupported: '{{label}} are not supported in SFMC SSJS. {{suggestion}}',
            suggestLogicalOr:
                "Replace ?? with || (note: semantics differ for falsy values like 0, '', and false)",
            suggestVarReturn:
                'Assign the object to a variable, then return the variable',
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
                    if (allowed.has(entry.feature)) continue;
                    if (entry.test && !entry.test(node)) continue;

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
                        report.suggest = [
                            {
                                messageId: 'suggestLogicalOr',
                                fix(fixer) {
                                    const src = context.sourceCode.getText();
                                    const between = src.slice(
                                        node.left.range[1],
                                        node.right.range[0],
                                    );
                                    const offset = between.indexOf('??');
                                    if (offset === -1) return null;
                                    const start = node.left.range[1] + offset;
                                    return fixer.replaceTextRange([start, start + 2], '||');
                                },
                            },
                        ];
                    } else if (entry.feature === 'DirectObjectReturn') {
                        report.suggest = [
                            {
                                messageId: 'suggestVarReturn',
                                fix(fixer) {
                                    const objText = context.sourceCode.getText(node.argument);
                                    const indent = ' '.repeat(node.loc.start.column);
                                    return fixer.replaceText(
                                        node,
                                        `var _result = ${objText};\n${indent}return _result;`,
                                    );
                                },
                            },
                        ];
                    }

                    context.report(report);
                }
            };
        }

        return listeners;
    },
};
