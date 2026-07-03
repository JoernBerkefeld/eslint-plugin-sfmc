import { isBuiltinBinding, BUILTIN_BINDINGS } from 'handlebars-data';

import { BINDING_PATTERN, closestMatch } from './_shared.js';

/**
 * Flags `{!$namespace.Field}` built-in data bindings that are not recognized
 * Marketing Cloud Next data bindings.
 *
 * The Handlebars parser treats `{!$...}` tokens as literal content, so this rule
 * scans the raw source text with a regex pass (mirroring the
 * `handlebars/unknown-binding` diagnostic emitted by sfmc-language-lsp) rather
 * than walking the AST.
 */

/** Proper-cased built-in binding names, used for "did you mean" suggestions. */
const BINDING_NAME_LIST = BUILTIN_BINDINGS.map((b) => b.name);
/** Map from lowercase binding name to its `{!$...}` token, for suggestion text. */
const BINDING_TOKEN_BY_NAME = new Map(BUILTIN_BINDINGS.map((b) => [b.name.toLowerCase(), b.token]));

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow unknown {!$...} built-in data bindings in Marketing Cloud Next Handlebars',
            recommended: true,
        },
        messages: {
            unknownBinding:
                "Unknown built-in binding '{{token}}'. It is not a recognized Marketing Cloud Next data binding.",
            unknownBindingSuggest:
                "Unknown built-in binding '{{token}}'. It is not a recognized Marketing Cloud Next data binding. Did you mean '{{suggestion}}'?",
        },
        schema: [],
    },

    create(context) {
        const sourceCode = context.sourceCode ?? context.getSourceCode();

        return {
            'Program:exit'() {
                const text = sourceCode.getText();
                BINDING_PATTERN.lastIndex = 0;
                let match;
                while ((match = BINDING_PATTERN.exec(text)) !== null) {
                    const bindingName = match[1];
                    if (isBuiltinBinding(bindingName)) {
                        continue;
                    }
                    const token = match[0];
                    const start = match.index;
                    const end = start + token.length;
                    const loc = {
                        start: sourceCode.getLocFromIndex(start),
                        end: sourceCode.getLocFromIndex(end),
                    };
                    const suggestionName = closestMatch(bindingName, BINDING_NAME_LIST);
                    const suggestion = suggestionName
                        ? BINDING_TOKEN_BY_NAME.get(suggestionName.toLowerCase())
                        : undefined;
                    if (suggestion) {
                        context.report({
                            loc,
                            messageId: 'unknownBindingSuggest',
                            data: { token, suggestion },
                        });
                    } else {
                        context.report({ loc, messageId: 'unknownBinding', data: { token } });
                    }
                }
            },
        };
    },
};
