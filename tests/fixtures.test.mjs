/**
 * Fixture snapshot test.
 *
 * Runs ESLint against every file in testFixture/rules/ using the strict config
 * that lives there, and compares the full set of diagnostics against a JSON
 * snapshot stored next to this file (fixtures.snapshot.json).
 *
 * If the snapshot does not exist yet, or you run with UPDATE_SNAPSHOTS=true,
 * the current output is written as the new baseline.
 *
 * Usage:
 *   node --test tests/fixtures.test.mjs                 # verify
 *   UPDATE_SNAPSHOTS=true node --test tests/fixtures.test.mjs  # update baseline
 */

import { ESLint } from 'eslint';
import { describe, it, before } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.join(__dirname, '..');
const fixtureDir = path.join(pluginRoot, 'testFixture', 'rules');
const snapshotPath = path.join(__dirname, 'fixtures.snapshot.json');

const UPDATE_SNAPSHOTS =
    process.env['UPDATE_SNAPSHOTS'] === 'true' || process.argv.includes('--update-snapshots');
const LINTABLE_EXTENSIONS = new Set(['.amp', '.ssjs', '.html']);

/**
 * Recursively collect all lintable files under a directory.
 *
 * @param {string} dir - Directory to search recursively.
 * @returns {string[]} Absolute file paths.
 */
function collectFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
            results.push(...collectFiles(full));
        } else if (LINTABLE_EXTENSIONS.has(path.extname(entry).toLowerCase())) {
            results.push(full);
        }
    }
    return results.toSorted();
}

/**
 * Normalise a raw ESLint message into a stable snapshot entry.
 * We record ruleId, severity, line, and messageId (only when defined).
 * Column is intentionally omitted — it tends to change with minor
 * whitespace edits and causes noisy diffs.
 * ruleId is null for fatal parse errors; messageId is omitted in that case
 * because ESLint does not set it on parser failures.
 *
 * @param {import('eslint').Linter.LintMessage} msg - Raw ESLint lint message to normalise.
 * @returns {{ ruleId: string|null, severity: number, line: number, messageId?: string }} Normalised entry for snapshot comparison.
 */
function normalise(msg) {
    /** @type {{ ruleId: string|null, severity: number, line: number, messageId?: string }} */
    const entry = {
        ruleId: msg.ruleId ?? null,
        severity: msg.severity,
        line: msg.line,
    };
    if (msg.messageId !== undefined) {
        entry.messageId = msg.messageId;
    }
    return entry;
}

describe('testFixture/rules — diagnostic snapshot', () => {
    /** @type {Record<string, ReturnType<typeof normalise>[]>} */
    let actual;

    before(async () => {
        const eslint = new ESLint({
            // Auto-discovers testFixture/rules/eslint.config.mjs
            cwd: fixtureDir,
            // Silence warnings for files matched by the config but normally warned about
            warnIgnored: false,
        });

        const files = collectFiles(fixtureDir);
        const results = await eslint.lintFiles(files);

        actual = {};
        for (const result of results) {
            if (result.messages.length === 0) {
                continue;
            }
            // Use forward-slash relative paths so the snapshot is portable across OSes
            const key = path.relative(pluginRoot, result.filePath).replaceAll('\\', '/');
            actual[key] = result.messages
                .map(normalise)
                .toSorted(
                    (a, b) => a.line - b.line || (a.ruleId ?? '').localeCompare(b.ruleId ?? ''),
                );
        }
        // Sort keys alphabetically so the snapshot diff is stable
        actual = Object.fromEntries(
            Object.entries(actual).toSorted(([a], [b]) => a.localeCompare(b)),
        );
    });

    it('every fixture file produces at least one diagnostic', () => {
        const files = collectFiles(fixtureDir);
        const withDiagnostics = new Set(
            Object.keys(actual).map((k) =>
                path.join(pluginRoot, k.replaceAll('/', '\\')).toLowerCase(),
            ),
        );
        const missing = files.filter((f) => !withDiagnostics.has(f.toLowerCase()));
        assert.deepStrictEqual(
            missing.map((f) => path.relative(pluginRoot, f).replaceAll('\\', '/')),
            [],
            'These fixture files produced no diagnostics — every fixture must have at least one FAIL example.',
        );
    });

    it('diagnostics match snapshot (run with UPDATE_SNAPSHOTS=true to refresh)', () => {
        if (UPDATE_SNAPSHOTS || !existsSync(snapshotPath)) {
            const json = JSON.stringify(actual, null, 2) + '\n';
            writeFileSync(snapshotPath, json, 'utf8');
            console.log(
                `  Snapshot written → ${path.relative(pluginRoot, snapshotPath).replaceAll('\\', '/')}`,
            );
            return;
        }

        const expected = JSON.parse(readFileSync(snapshotPath, 'utf8'));
        assert.deepStrictEqual(
            actual,
            expected,
            'Fixture diagnostics changed. If this is intentional, run:\n  UPDATE_SNAPSHOTS=true node --test tests/fixtures.test.mjs',
        );
    });
});
