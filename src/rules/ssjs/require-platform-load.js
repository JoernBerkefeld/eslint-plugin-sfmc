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

import { coreObjectNames, SSJS_GLOBALS } from 'ssjs-data';

const TOP_LEVEL_CORE_NAMES = new Set([...coreObjectNames].map((n) => n.split('.', 1)[0]));

// Globals that resolve at runtime only after Platform.Load("core", ...) has been called.
// E.g. Now(), Write(), GUID(), Base64Encode(), Attribute.GetValue(), DateTime.Parse(), …
const CORE_LOAD_DEPENDENT_GLOBALS = new Set(
    SSJS_GLOBALS.filter((g) => g.requiresCoreLoad).map((g) => g.name.toLowerCase()),
);

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
                    for (const [index, { node, name }] of pendingReports.entries()) {
                        context.report({
                            node,
                            messageId: 'missingLoad',
                            data: { name },
                            // Only attach the fix to the first violation to prevent
                            // ESLint from inserting the statement multiple times.
                            fix:
                                index === 0
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

    // Bare call: Now(), Write(), GUID(), Base64Encode(), Redirect(), …
    if (callee.type === 'Identifier') {
        if (CORE_LOAD_DEPENDENT_GLOBALS.has(callee.name.toLowerCase())) {
            return callee.name;
        }
        return null;
    }

    if (callee.type !== 'MemberExpression') {
        return null;
    }

    // Nested Core Library call: DataExtension.Rows.Init(…)
    if (
        callee.object.type === 'MemberExpression' &&
        callee.object.object.type === 'Identifier' &&
        TOP_LEVEL_CORE_NAMES.has(callee.object.object.name) &&
        callee.object.property.type === 'Identifier' &&
        callee.property.type === 'Identifier'
    ) {
        return `${callee.object.object.name}.${callee.object.property.name}`;
    }

    if (callee.object.type === 'Identifier' && callee.property.type === 'Identifier') {
        const objectName = callee.object.name;

        // Core Library static Init: DataExtension.Init(…), Subscriber.Init(…), …
        if (TOP_LEVEL_CORE_NAMES.has(objectName) && callee.property.name === 'Init') {
            return objectName;
        }

        // requiresCoreLoad globals used as object: Attribute.GetValue(…), DateTime.Parse(…), …
        if (CORE_LOAD_DEPENDENT_GLOBALS.has(objectName.toLowerCase())) {
            return `${objectName}.${callee.property.name}`;
        }
    }

    return null;
}
