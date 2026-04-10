/**
 * Rule: require-platform-load
 *
 * Ensures Platform.Load("core", "1") is called before any Core library
 * object constructors are used. Without this call, Core library objects
 * like DataExtension.Init() crash at runtime.
 *
 * Auto-fix: inserts Platform.Load("core", "1.1.5") at the very top of the
 * file when it is entirely absent. The fix is only attached to the first
 * reported violation so ESLint does not duplicate the insertion.
 */

import { coreObjectNames } from 'ssjs-data';

const TOP_LEVEL_CORE_NAMES = new Set([...coreObjectNames].map((n) => n.split('.')[0]));

const PLATFORM_LOAD_STATEMENT = 'Platform.Load("core", "1.1.5");\n';

export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        docs: {
            description: 'Require Platform.Load() before using Core library objects',
        },
        messages: {
            missingLoad:
                'Platform.Load("core", "1") must be called before using Core library object "{{name}}". Without it, the call will fail at runtime.',
        },
        schema: [],
    },

    create(context) {
        let hasPlatformLoad = false;
        const pendingReports = [];

        return {
            CallExpression(node) {
                if (isPlatformLoadCall(node)) {
                    hasPlatformLoad = true;
                    return;
                }

                const coreName = getCoreObjectUsage(node);
                if (coreName && !hasPlatformLoad) {
                    pendingReports.push({ node, name: coreName });
                }
            },

            'Program:exit'() {
                if (!hasPlatformLoad) {
                    for (const [i, { node, name }] of pendingReports.entries()) {
                        context.report({
                            node,
                            messageId: 'missingLoad',
                            data: { name },
                            // Only attach the fix to the first violation to prevent
                            // ESLint from inserting the statement multiple times.
                            fix:
                                i === 0
                                    ? (fixer) =>
                                          fixer.insertTextBeforeRange(
                                              [0, 0],
                                              PLATFORM_LOAD_STATEMENT,
                                          )
                                    : undefined,
                        });
                    }
                }
            },
        };
    },
};

function isPlatformLoadCall(node) {
    const callee = node.callee;
    if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'Platform' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'Load'
    ) {
        const arguments_ = node.arguments;
        if (
            arguments_.length > 0 &&
            arguments_[0].type === 'Literal' &&
            typeof arguments_[0].value === 'string' &&
            arguments_[0].value.toLowerCase() === 'core'
        ) {
            return true;
        }
    }
    return false;
}

function getCoreObjectUsage(node) {
    const callee = node.callee;
    if (callee.type !== 'MemberExpression') {
        return null;
    }

    if (
        callee.object.type === 'MemberExpression' &&
        callee.object.object.type === 'Identifier' &&
        TOP_LEVEL_CORE_NAMES.has(callee.object.object.name) &&
        callee.object.property.type === 'Identifier' &&
        callee.property.type === 'Identifier'
    ) {
        return `${callee.object.object.name}.${callee.object.property.name}`;
    }

    if (
        callee.object.type === 'Identifier' &&
        TOP_LEVEL_CORE_NAMES.has(callee.object.name) &&
        callee.property.type === 'Identifier'
    ) {
        const method = callee.property.name;
        if (method === 'Init') {
            return callee.object.name;
        }
    }

    return null;
}
