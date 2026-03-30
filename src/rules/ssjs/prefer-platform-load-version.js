/**
 * Rule: prefer-platform-load-version
 *
 * Warns when Platform.Load("Core", version) uses a version string other
 * than the recommended "1.1.5". Older versions like "1" or "1.1.1" miss
 * bug-fixes and features available in the latest Core library release.
 */

const DEFAULT_VERSION = '1.1.5';

export default {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Enforce a minimum version string in Platform.Load() calls',
        },
        fixable: 'code',
        messages: {
            outdatedVersion:
                'Platform.Load("Core", "{{actual}}") should use version "{{expected}}" to get the latest bug-fixes. Update the second argument.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    version: {
                        type: 'string',
                        description: 'The recommended Core library version string.',
                    },
                },
                additionalProperties: false,
            },
        ],
    },

    create(context) {
        const options = context.options[0] || {};
        const expectedVersion = options.version || DEFAULT_VERSION;

        return {
            CallExpression(node) {
                const callee = node.callee;
                if (
                    callee.type !== 'MemberExpression' ||
                    callee.object.type !== 'Identifier' ||
                    callee.object.name !== 'Platform' ||
                    callee.property.type !== 'Identifier' ||
                    callee.property.name !== 'Load'
                ) {
                    return;
                }

                const arguments_ = node.arguments;
                if (
                    arguments_.length === 0 ||
                    arguments_[0].type !== 'Literal' ||
                    typeof arguments_[0].value !== 'string' ||
                    arguments_[0].value.toLowerCase() !== 'core'
                ) {
                    return;
                }

                if (arguments_.length < 2) {
                    context.report({
                        node,
                        messageId: 'outdatedVersion',
                        data: { actual: '(none)', expected: expectedVersion },
                        fix(fixer) {
                            return fixer.insertTextAfter(
                                arguments_[0],
                                `, "${expectedVersion}"`,
                            );
                        },
                    });
                    return;
                }

                const versionArgument = arguments_[1];
                if (
                    versionArgument.type === 'Literal' &&
                    typeof versionArgument.value === 'string' &&
                    versionArgument.value !== expectedVersion
                ) {
                    context.report({
                        node: versionArgument,
                        messageId: 'outdatedVersion',
                        data: { actual: versionArgument.value, expected: expectedVersion },
                        fix(fixer) {
                            return fixer.replaceText(versionArgument, `"${expectedVersion}"`);
                        },
                    });
                }
            },
        };
    },
};
