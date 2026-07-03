/**
 * Shared helpers for the Handlebars (Marketing Cloud Next) ESLint rules.
 *
 * Mirrors the logic used by the sfmc-language-lsp MCN Handlebars validator so
 * that ESLint diagnostics and editor diagnostics stay consistent.
 */

/** Matches a `{!$namespace.Field}` built-in data binding token. */
export const BINDING_PATTERN = /\{!\$([A-Za-z0-9_.]+)\}/g;

/**
 * Returns the bare helper name when a node's path is a simple, single-part
 * identifier (e.g. `add`), or null when it is a property access (`foo.bar`),
 * a data variable (`@index`), a literal, or `this`.
 *
 * @param {object | undefined} path - The node's path expression.
 * @returns {string | null} The simple helper name, or null.
 */
export function simpleHelperName(path) {
    if (!path || path.type !== 'PathExpression') {
        return null;
    }
    if (path.data) {
        return null;
    }
    if ((path.depth ?? 0) > 0) {
        return null;
    }
    const parts = path.parts ?? [];
    if (parts.length !== 1) {
        return null;
    }
    const name = parts[0];
    if (!name || name === 'this') {
        return null;
    }
    return name;
}

/**
 * Returns true when a mustache/subexpression node is a helper invocation rather
 * than a bare data binding. A `{{foo}}` mustache with no params/hash is a data
 * binding; a subexpression `(foo ...)` is always an invocation.
 *
 * @param {object} node - The AST node.
 * @returns {boolean} True when the node invokes a helper.
 */
export function isInvocation(node) {
    const hasArgs = (node.params?.length ?? 0) > 0 || (node.hash?.pairs?.length ?? 0) > 0;
    return node.type === 'SubExpression' || hasArgs;
}

/**
 * Compute the Levenshtein edit distance between two strings.
 *
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} The minimum number of single-character edits.
 */
export function levenshtein(a, b) {
    if (a === b) {
        return 0;
    }
    if (a.length === 0) {
        return b.length;
    }
    if (b.length === 0) {
        return a.length;
    }

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    const curr = Array.from({ length: b.length + 1 }, () => 0);

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        prev = curr.slice();
    }
    return prev[b.length];
}

/**
 * Return the candidate closest to `word` (case-insensitive) when it is within a
 * conservative typo threshold, or null when nothing is close enough.
 *
 * @param {string} word - The unknown word typed by the user.
 * @param {Iterable<string>} candidates - Known valid names to match against.
 * @returns {string | null} The closest candidate (original casing), or null.
 */
export function closestMatch(word, candidates) {
    const lowerWord = word.toLowerCase();
    const maxDistance = lowerWord.length <= 4 ? 1 : 2;

    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
        const distance = levenshtein(lowerWord, candidate.toLowerCase());
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    }

    if (best !== null && bestDistance > 0 && bestDistance <= maxDistance) {
        return best;
    }
    return null;
}
