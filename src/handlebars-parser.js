/**
 * ESLint-compatible parser for Marketing Cloud Next Handlebars.
 *
 * Wraps the `@handlebars/parser` package and adds the metadata ESLint needs:
 *   - `range: [start, end]` on every node (derived from the parser's
 *     1-based-line / 0-based-column `loc` via a line-start table)
 *   - `loc: { start: {line,column}, end: {line,column} }` (kept from the parser,
 *     whose convention already matches ESLint: 1-based line, 0-based column)
 *   - Root node typed as "Program" with `body`, `tokens`, `comments`
 *   - `visitorKeys` so ESLint knows how to traverse Handlebars node types
 *
 * AMPscript regions inside the source must be blanked out before this parser
 * runs (the processor does this) so Handlebars never sees `%%[ ... ]%%` syntax.
 */

import { parse as hbsParse } from '@handlebars/parser';

// ── Node renaming for ESTree collisions ───────────────────────────────────
//
// `BlockStatement` is also an ESTree node type, so ESLint's built-in scope
// analysis (eslint-scope) tries to open a lexical scope for it and crashes on
// the Handlebars shape. Likewise, a Handlebars `BlockStatement` contains nested
// `Program` nodes (its `program`/`inverse` bodies); eslint-scope treats every
// `Program` as a global scope and asserts when they nest. Rename both to
// Hbs-prefixed types so the JS analyzer leaves them alone — only the single
// synthetic root keeps the real `Program` type. The hbs rules and visitorKeys
// reference the renamed types.

const NODE_RENAME = {
    BlockStatement: 'HbsBlockStatement',
    Program: 'HbsProgram',
};

// ── Visitor keys for all Handlebars AST node types ────────────────────────

export const visitorKeys = {
    Program: ['body'],
    HbsProgram: ['body'],
    MustacheStatement: ['path', 'params', 'hash'],
    HbsBlockStatement: ['path', 'params', 'hash', 'program', 'inverse'],
    PartialStatement: ['name', 'params', 'hash'],
    PartialBlockStatement: ['name', 'params', 'hash', 'program'],
    DecoratorBlock: ['path', 'params', 'hash', 'program'],
    Decorator: ['path', 'params', 'hash'],
    ContentStatement: [],
    CommentStatement: [],
    SubExpression: ['path', 'params', 'hash'],
    PathExpression: [],
    StringLiteral: [],
    NumberLiteral: [],
    BooleanLiteral: [],
    UndefinedLiteral: [],
    NullLiteral: [],
    Hash: ['pairs'],
    HashPair: ['value'],
};

// ── line/column → offset mapping ──────────────────────────────────────────

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

function locToOffset(position, lineStarts, textLength) {
    if (!position || typeof position.line !== 'number') {
        return 0;
    }
    const lineIndex = Math.max(0, position.line - 1);
    const base = lineIndex < lineStarts.length ? lineStarts[lineIndex] : textLength;
    const offset = base + Math.max(0, position.column);
    return Math.min(offset, textLength);
}

// ── AST annotation ────────────────────────────────────────────────────────

function annotateNode(node, lineStarts, textLength, fallback) {
    if (!node || typeof node !== 'object') {
        return;
    }

    // Rename colliding ESTree types so ESLint's JS scope analysis ignores them.
    if (node.type && NODE_RENAME[node.type]) {
        node.type = NODE_RENAME[node.type];
    }

    // ESLint requires every traversed node to expose a numeric `range` and a
    // matching `loc`. `@handlebars/parser` attaches `loc` to most nodes but a
    // few (e.g. Hash, HashPair) can omit it — inherit the parent's span so the
    // traverser never sees an undefined range.
    let span = fallback;
    if (node.loc && node.loc.start && node.loc.end) {
        const start = locToOffset(node.loc.start, lineStarts, textLength);
        const end = locToOffset(node.loc.end, lineStarts, textLength);
        node.range = [start, end];
        node.start = start;
        node.end = end;
        node.loc = {
            start: { line: node.loc.start.line, column: node.loc.start.column },
            end: { line: node.loc.end.line, column: node.loc.end.column },
        };
        span = { range: node.range, loc: node.loc };
    } else if (fallback) {
        node.range = [...fallback.range];
        node.start = fallback.range[0];
        node.end = fallback.range[1];
        node.loc = {
            start: { ...fallback.loc.start },
            end: { ...fallback.loc.end },
        };
    }

    const keys = visitorKeys[node.type];
    if (!keys) {
        return;
    }

    for (const key of keys) {
        const child = node[key];
        if (Array.isArray(child)) {
            for (const item of child) {
                if (item && typeof item === 'object') {
                    annotateNode(item, lineStarts, textLength, span);
                }
            }
        } else if (child && typeof child === 'object') {
            annotateNode(child, lineStarts, textLength, span);
        }
    }
}

// ── Public ESLint parser interface ────────────────────────────────────────

export function parseForESLint(code) {
    const lineStarts = buildLineTable(code);

    let handlebarsAst;
    try {
        handlebarsAst = hbsParse(code);
    } catch (ex) {
        const loc = ex && ex.hash && ex.hash.loc;
        const rawMessage = (ex && ex.message) || 'Handlebars syntax error.';
        const messageLines = rawMessage.split('\n').filter((line) => line.trim().length > 0);
        const error = new SyntaxError(messageLines.at(-1) || rawMessage);
        error.lineNumber = loc ? Math.max(1, loc.first_line) : 1;
        error.column = loc ? Math.max(1, loc.first_column + 1) : 1;
        throw error;
    }

    const ast = {
        type: 'Program',
        body: handlebarsAst.body || [],
        start: 0,
        end: code.length,
        range: [0, code.length],
        loc: {
            start: { line: 1, column: 0 },
            end: handlebarsAst.loc
                ? { line: handlebarsAst.loc.end.line, column: handlebarsAst.loc.end.column }
                : {
                      line: lineStarts.length,
                      column: code.length - lineStarts.at(-1),
                  },
        },
        tokens: [],
        comments: [],
    };

    for (const child of ast.body) {
        annotateNode(child, lineStarts, code.length);
    }

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
