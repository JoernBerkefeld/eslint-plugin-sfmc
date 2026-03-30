/**
 * ESLint-compatible parser for AMPscript.
 *
 * Reuses the shared ampscript-parser package for tokenization and statement
 * parsing, then wraps the resulting AST with ESLint-required metadata:
 *   - `range: [start, end]` on every node
 *   - `loc: { start: {line,column}, end: {line,column} }` on every node
 *   - Root node typed as "Program" with `body`, `tokens`, `comments`
 *   - `visitorKeys` so ESLint knows how to traverse custom node types
 */

import { parse as prettierParse } from 'ampscript-parser';

// ── Visitor keys for all AMPscript AST node types ─────────────────────────
//
// Node types that collide with ESTree names (IfStatement, ForStatement,
// ExpressionStatement) are prefixed with "Amp" so ESLint's built-in
// JavaScript code-path analysis does not try to process them.

const NODE_RENAME = {
    IfStatement: 'AmpIfStatement',
    ForStatement: 'AmpForStatement',
    ExpressionStatement: 'AmpExpressionStatement',
};

export const visitorKeys = {
    Program: ['body'],
    Content: [],
    Block: ['statements'],
    InlineExpression: ['expression'],
    Comment: [],
    VarDeclaration: ['variables'],
    SetStatement: ['target', 'value'],
    AmpIfStatement: ['condition', 'consequent', 'alternates'],
    ElseIfClause: ['condition', 'body'],
    ElseClause: ['body'],
    AmpForStatement: ['counter', 'startExpr', 'endExpr', 'body'],
    AmpExpressionStatement: ['expression'],
    FunctionCall: ['arguments'],
    Variable: [],
    Identifier: [],
    StringLiteral: [],
    NumberLiteral: [],
    BooleanLiteral: [],
    BinaryExpression: ['left', 'right'],
    UnaryExpression: ['argument'],
    ParenExpression: ['expression'],
    RawStatement: [],
    Raw: [],
    Empty: [],
};

// ── Offset → line/column mapping ──────────────────────────────────────────

function buildLineTable(text) {
    const starts = [0];
    for (let index = 0; index < text.length; index++) {
        if (text[index] === '\n') {
            starts.push(index + 1);
        } else if (text[index] === '\r') {
            if (text[index + 1] === '\n') {
                starts.push(index + 2);
                index++;
            } else {
                starts.push(index + 1);
            }
        }
    }
    return starts;
}

function offsetToLoc(offset, lineStarts) {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStarts[mid] <= offset) lo = mid;
        else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - lineStarts[lo] };
}

// ── AST annotation ────────────────────────────────────────────────────────

function annotateNode(node, lineStarts, comments) {
    if (!node || typeof node !== 'object') return;

    // Rename colliding ESTree types to Amp-prefixed equivalents
    if (node.type && NODE_RENAME[node.type]) {
        node.type = NODE_RENAME[node.type];
    }

    if (typeof node.start === 'number' && typeof node.end === 'number') {
        node.range = [node.start, node.end];
        node.loc = {
            start: offsetToLoc(node.start, lineStarts),
            end: offsetToLoc(node.end, lineStarts),
        };
    }

    if (node.type === 'Comment') {
        comments.push(node);
    }

    const keys = visitorKeys[node.type];
    if (!keys) return;

    for (const key of keys) {
        const child = node[key];
        if (Array.isArray(child)) {
            for (const item of child) {
                if (item && typeof item === 'object') {
                    annotateNode(item, lineStarts, comments);
                }
            }
        } else if (child && typeof child === 'object') {
            annotateNode(child, lineStarts, comments);
        }
    }
}

// ── Public ESLint parser interface ────────────────────────────────────────

export function parseForESLint(code) {
    const prettierAst = prettierParse(code);
    const lineStarts = buildLineTable(code);
    const comments = [];

    const ast = {
        type: 'Program',
        body: prettierAst.children || [],
        start: 0,
        end: code.length,
        range: [0, code.length],
        loc: {
            start: { line: 1, column: 0 },
            end: offsetToLoc(code.length, lineStarts),
        },
        tokens: [],
        comments: [],
    };

    for (const child of ast.body) {
        annotateNode(child, lineStarts, comments);
    }

    ast.comments = comments;

    return {
        ast,
        visitorKeys,
        services: {},
        scopeManager: null,
    };
}

export function parse(code) {
    return parseForESLint(code).ast;
}
