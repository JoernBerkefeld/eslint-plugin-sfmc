/**
 * Rule: require-platform-load-order
 *
 * Warns when Core library .Init() calls appear *before*
 * Platform.Load("core", ...) in source order. Unlike require-platform-load
 * which only checks existence, this rule checks ordering.
 */

import { coreObjectNames } from 'ssjs-data';

const TOP_LEVEL_CORE_NAMES = new Set([...coreObjectNames].map((n) => n.split('.')[0]));

export default {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Require Platform.Load() to appear before Core library usage in source order',
        },
        messages: {
            loadAfterUse:
                'Platform.Load("core", ...) must appear before "{{name}}" usage at line {{useLine}}. Move it earlier in the file.',
        },
        schema: [],
    },

    create(context) {
        let platformLoadLine = null;
        const coreUsages = [];

        return {
            CallExpression(node) {
                if (isPlatformLoadCall(node)) {
                    if (platformLoadLine === null) {
                        platformLoadLine = node.loc.start.line;
                    }
                    return;
                }

                const coreName = getCoreObjectUsage(node);
                if (coreName) {
                    coreUsages.push({ node, name: coreName, line: node.loc.start.line });
                }
            },

            'Program:exit'() {
                if (platformLoadLine === null) return;

                for (const usage of coreUsages) {
                    if (usage.line < platformLoadLine) {
                        context.report({
                            node: usage.node,
                            messageId: 'loadAfterUse',
                            data: {
                                name: usage.name,
                                useLine: String(usage.line),
                            },
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
    if (callee.type !== 'MemberExpression') return null;

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
        callee.property.type === 'Identifier' &&
        callee.property.name === 'Init'
    ) {
        return callee.object.name;
    }

    return null;
}
