# Manual auto-fix test suite

Use this folder to verify the five upgraded rules **before release**. Files here use `ecmaVersion: 2022` for SSJS so `let`, `??`, and other modern syntax parse correctly and the rule (not the parser) reports violations.

## Prerequisites

From `eslint-plugin-sfmc/`:

```powershell
npm ci --no-workspaces
```

## Automated verification (run first)

```powershell
npm test
npm run test:autofix-manual
```

`test:autofix-manual` copies each `.before.*` file, runs `eslint --fix`, and compares the result to the matching `.expected.*` file.

## Manual verification checklist

For each pair below, run `--fix` and diff against the expected file (or eyeball in VS Code).

| # | Rule | Before | Expected after fix |
|---|------|--------|-------------------|
| 1 | `amp-require-variable-declaration` | `amp-require-variable-declaration.before.amp` | `.expected.amp` |
| 2 | `ssjs-cache-loop-length` | `ssjs-cache-loop-length.before.ssjs` | `.expected.ssjs` |
| 3 | `ssjs-require-hasownproperty` | `ssjs-require-hasownproperty.before.ssjs` | `.expected.ssjs` |
| 4 | `ssjs-no-unsupported-syntax` | `ssjs-no-unsupported-syntax.before.ssjs` | `.expected.ssjs` |
| 5 | `ssjs-no-property-call` | `ssjs-no-property-call.before.ssjs` | `.expected.ssjs` |

### Command (single file)

```powershell
cd "c:\EDF\Git\sfmc-amscript-language\eslint-plugin-sfmc"
Copy-Item "testFixture\manual-autofix\ssjs-cache-loop-length.before.ssjs" "testFixture\manual-autofix\_scratch.ssjs"
npx eslint --fix --config "testFixture\manual-autofix\eslint.config.mjs" "testFixture\manual-autofix\_scratch.ssjs"
Get-Content "testFixture\manual-autofix\_scratch.ssjs"
Remove-Item "testFixture\manual-autofix\_scratch.ssjs"
```

### VS Code

1. Open `eslint-plugin-sfmc` in the workspace.
2. Open a `.before.ssjs` or `.before.amp` file.
3. Ensure ESLint uses the manual config (temporarily point workspace `eslint.options.overrideConfigFile` at `testFixture/manual-autofix/eslint.config.mjs`), or run the CLI command above.
4. Run **Fix all auto-fixable problems** or `eslint --fix`.

## What each fix should do

| Rule | Fix behavior |
|------|----------------|
| `amp-require-variable-declaration` | Inserts `var @name` before first undeclared `set` (once per variable) |
| `ssjs-cache-loop-length` | Adds `, _len = arr.length` to loop init; replaces test with `_len` |
| `ssjs-require-hasownproperty` | Wraps loop body in `if (obj.hasOwnProperty(k)) { ... }` |
| `ssjs-no-unsupported-syntax` | `let`/`const`→`var`; `??`→`\|\|`; `return {…}`→`var _result` + `return _result` |
| `ssjs-no-property-call` | Removes `()` on read; Response setter call→assignment (incl. comma expressions) |

## After manual sign-off

Do **not** tag or push until you confirm. Then ask the agent to: bump version, commit, and release per `release-tracking.mdc`.
