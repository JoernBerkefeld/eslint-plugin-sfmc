import { functionNames, functionLookup, getMcnApiVersion } from 'ampscript-data';

/**
 * Flags AMPscript functions that cannot be used when targeting Marketing Cloud
 * Next, and functions that work in MCN AMPscript but have no Handlebars
 * equivalent (so they block a Handlebars migration).
 *
 * Each function carries an `mcnSince` value = the MCN API version it first
 * became available in, or `null`/unset when it was never supported in MCN.
 *
 * `apiVersion` semantics (shared with the SSJS and Handlebars MCN rules):
 *   - Not set / null: flag every function whose `mcnSince` is null/unset. Any
 *     function supported at some point in MCN (numeric `mcnSince`) passes.
 *   - Set to N: flag everything the null case flags, PLUS everything whose
 *     `mcnSince` is greater than N (too new for the target). Pass iff
 *     `mcnSince != null && mcnSince <= N`.
 *
 * Unknown-function reporting stays in `amp-no-unknown-function`; this rule only
 * evaluates functions that exist in the AMPscript catalog.
 */
export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Disallow AMPscript functions that are not available in the targeted Marketing Cloud Next API version',
            recommended: true,
        },
        messages: {
            notSupportedInMcn: "'{{name}}' is not supported in Marketing Cloud Next.",
            tooNewForTarget:
                "'{{name}}' was introduced in Marketing Cloud Next API version {{since}}, which is newer than the targeted version {{target}}.",
            noHandlebarsEquivalent:
                "'{{name}}' is supported by Marketing Cloud Next AMPscript but has no Handlebars for Marketing Cloud Next equivalent. It cannot be migrated to a Handlebars helper.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    apiVersion: {
                        type: 'number',
                        description:
                            'The targeted Marketing Cloud Next API version (e.g. 65 = Winter \u{2019}26, 67 = Summer \u{2019}26). Functions newer than this are flagged.',
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] ?? {};
        const apiVersion = typeof options.apiVersion === 'number' ? options.apiVersion : null;

        return {
            FunctionCall(node) {
                const lower = node.name.toLowerCase();

                // Unknown functions are handled by amp-no-unknown-function.
                if (!functionNames.has(lower)) {
                    return;
                }

                const since = getMcnApiVersion(lower);

                // Never supported in MCN → always flag.
                if (since === null) {
                    context.report({
                        node,
                        messageId: 'notSupportedInMcn',
                        data: { name: node.name },
                    });
                    return;
                }

                // Supported in MCN but newer than the targeted API version.
                if (apiVersion !== null && since > apiVersion) {
                    context.report({
                        node,
                        messageId: 'tooNewForTarget',
                        data: {
                            name: node.name,
                            since: String(since),
                            target: String(apiVersion),
                        },
                    });
                    return;
                }

                // Works in MCN AMPscript but has no Handlebars counterpart, so it
                // cannot be migrated to a Handlebars helper.
                if (functionLookup.get(lower)?.mcnHandlebarsGap === true) {
                    context.report({
                        node,
                        messageId: 'noHandlebarsEquivalent',
                        data: { name: node.name },
                    });
                }
            },
        };
    },
};
