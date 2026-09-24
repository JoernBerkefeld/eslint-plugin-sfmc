import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sfmc from '../src/index.js';

const minimumPath = fileURLToPath(import.meta.resolve('eslint-minimum'));
const minimumUrl = pathToFileURL(minimumPath).href;
const minimumRequire = createRequire(minimumUrl);
const { ESLint } = await import(minimumUrl);
const { defineConfig } = minimumRequire('eslint/config');
const cwd = fileURLToPath(new URL('..', import.meta.url));

function engine(config) {
    return new ESLint({ cwd, overrideConfigFile: true, overrideConfig: config });
}

test('base plugin remains supported at the exact ESLint 10.0.0 floor', async () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(manifest.peerDependencies.eslint, '>=10.0.0');
    assert.equal(manifest.devDependencies['eslint-minimum'], 'npm:eslint@10.0.0');
    assert.equal(ESLint.version, '10.0.0');

    const raw = engine([...sfmc.configs.recommended]);
    const defined = engine(defineConfig(sfmc.configs.recommended));
    for (const linter of [raw, defined]) {
        const [result] = await linter.lintText('%%[ UnknownMinimumFloorFunction() ]%%', {
            filePath: path.join(cwd, 'minimum-floor.amp'),
        });
        assert.equal(result.fatalErrorCount, 0, JSON.stringify(result.messages));
        assert.ok(
            result.messages.some((message) => message.ruleId === 'sfmc/amp-no-unknown-function'),
        );
    }
});
