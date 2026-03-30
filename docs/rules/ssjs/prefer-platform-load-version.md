# `sfmc/ssjs-prefer-platform-load-version`

> Enforce a minimum version string in `Platform.Load()` calls.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` (not in `recommended` table — enabled in `strict`) |
| **Fixable** | **Auto-fix** (`eslint --fix`) |

## Why This Rule Exists

`Platform.Load("core", "1")` or `"1.1.1"` loads an older version of the Core library that is missing bug fixes present in `"1.1.5"`. Using the latest stable version is documented as best practice in Mateusz Dąbrowski's SSJS style guide. This rule flags any version string other than the configured target and also flags calls where the version argument is missing entirely.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |
| `version` | Any version string | `"1.1.5"` |

### Default behavior (enforce `"1.1.5"`)

**Not allowed:**

```js
Platform.Load("core", "1");
Platform.Load("core", "1.1.1");
Platform.Load("core");   /* missing version argument */
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");
```

### With `version: "1.1.6"` (custom minimum)

Flags anything that is not `"1.1.6"`, including `"1.1.5"`.

## Fix

This rule provides an **auto-fix**. Applied by:

- `eslint --fix` on the command line (because `meta.type` is `"suggestion"`, you can also target it specifically with `--fix-type suggestion`)
- **Fix this issue** / **Fix all auto-fixable problems** in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- On save via `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`

What the fix does:
- When the version argument is present but wrong: replaces the version string literal with the required version.
- When the version argument is missing entirely: inserts `, "1.1.5"` after the `"core"` argument.

## Configuration Example

```js
// eslint.config.js
rules: {
  'sfmc/ssjs-prefer-platform-load-version': ['warn', { version: '1.1.5' }]
}
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-prefer-platform-load-version': 'off' }
```
