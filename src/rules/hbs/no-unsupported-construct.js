import { unsupportedByNodeType } from 'handlebars-data';

import { simpleHelperName } from './_shared.js';

/**
 * Flags Handlebars constructs that the locked-down Marketing Cloud Next engine
 * cannot support: partials, partial blocks, decorators, inline partials, and the
 * handlebars.js-only `{{log}}` debugging helper.
 *
 * Mirrors the `handlebars/unsupported-construct` diagnostic emitted by
 * sfmc-language-lsp.
 */

/** AST node types that may carry an unsupported construct. */
const NODE_TYPES = [...unsupportedByNodeType.keys()];

// The handlebars-data messages contain literal `{{> ...}}`, `{{log}}`, etc. as
// examples. ESLint treats `{{...}}` in a message template as an interpolation
// placeholder, so the literal text is passed through a single `{{text}}`
// placeholder instead of being baked into the template.
/** messageId per construct id → passthrough template, declared statically. */
const MESSAGES = Object.fromEntries(
    [...unsupportedByNodeType.values()].flat().map((entry) => [entry.id, '{{text}}']),
);

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow Handlebars constructs unsupported by the Marketing Cloud Next engine (partials, decorators, log)',
            recommended: true,
        },
        messages: MESSAGES,
        schema: [],
    },

    create(context) {
        /**
         * Reports the first unsupported-construct entry matching a node.
         *
         * @param {object} node - The Handlebars AST node.
         * @returns {void}
         */
        function check(node) {
            const candidates = unsupportedByNodeType.get(node.type);
            if (!candidates) {
                return;
            }
            const helperName = simpleHelperName(node.path);
            for (const entry of candidates) {
                if (entry.helperName !== null && entry.helperName !== helperName) {
                    continue;
                }
                context.report({ node, messageId: entry.id, data: { text: entry.message } });
                return;
            }
        }

        const visitors = {};
        for (const nodeType of NODE_TYPES) {
            visitors[nodeType] = check;
        }
        return visitors;
    },
};
