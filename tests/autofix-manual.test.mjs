/**
 * Integration test: run eslint --fix on manual-autofix .before.* files
 * and compare output to .expected.* baselines.
 */

import { ESLint } from 'eslint';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.join(__dirname, '..');
const manualDirectory = path.join(pluginRoot, 'testFixture', 'manual-autofix');
const configPath = path.join(manualDirectory, 'eslint.config.mjs');

/** @type {{beforeName: string, expectedName: string, base: string}[]} */
const pairs = readdirSync(manualDirectory)
    .filter((name) => name.endsWith('.before.amp') || name.endsWith('.before.ssjs'))
    .map((beforeName) => {
        const expectedName = beforeName.replace('.before.', '.expected.');
        return { beforeName, expectedName, base: beforeName.replace(/\.before\.(amp|ssjs)$/, '') };
    });

describe('manual-autofix — eslint --fix integration', () => {
    for (const { beforeName, expectedName, base } of pairs) {
        it(`${base} — fix output matches expected`, async () => {
            const beforePath = path.join(manualDirectory, beforeName);
            const expectedPath = path.join(manualDirectory, expectedName);
            const scratchPath = path.join(
                manualDirectory,
                `_scratch_${base}${path.extname(beforeName)}`,
            );

            writeFileSync(scratchPath, readFileSync(beforePath, 'utf8'));

            const eslint = new ESLint({
                overrideConfigFile: configPath,
                cwd: manualDirectory,
                fix: true,
            });

            const results = await eslint.lintFiles([scratchPath]);
            await ESLint.outputFixes(results);

            const actual = readFileSync(scratchPath, 'utf8');
            const expected = readFileSync(expectedPath, 'utf8');

            assert.equal(
                actual,
                expected,
                `Auto-fix output for ${beforeName} did not match ${expectedName}`,
            );

            unlinkSync(scratchPath);
        });
    }
});
