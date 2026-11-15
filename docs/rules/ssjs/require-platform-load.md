# `sfmc/ssjs-require-platform-load`

> Require `Platform.Load("core", ...)` before using Core library objects.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | **Auto-fix** (`eslint --fix`) |

## Why This Rule Exists

SFMC's SSJS runtime requires `Platform.Load("core", "1.1.5")` to be called before any Core library object (`DataExtension`, `Subscriber`, `Email`, `SFMC`, etc.) is used. Without it, calls to `DataExtension.Init()` and similar methods crash at runtime with an object-not-found error. The Platform.Load call initialises the Core library and makes its classes available.

The same applies to the globals that only exist once the Core library is loaded. This includes the `HTTP` object: `HTTP.Get(...)` and `HTTP.Post(...)` are reported when the file has no `Platform.Load("core", ...)` call.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
var de = DataExtension.Init("MyDE");
var rows = de.Rows.Retrieve();
```

```js
var response = HTTP.Get("https://example.com/api");
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");
var de = DataExtension.Init("MyDE");
var rows = de.Rows.Retrieve();
```

```js
Platform.Load("core", "1.1.5");
var response = HTTP.Get("https://example.com/api");
```

## Fix

This rule provides an **auto-fix**. Applied by:

- `eslint --fix` on the command line (applies ALL fixable rules regardless of `meta.type`; use `--fix-type problem` to target only problem-type rules)
- **Fix this issue** / **Fix all auto-fixable problems** in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- On save via `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`

What the fix does: inserts `Platform.Load("core", "1.1.5");` at the very beginning of the file. The fix is attached to the first reported violation only, so it is inserted exactly once even when multiple Core objects are used.

## When to Disable

Only disable this rule if you are intentionally writing SSJS that uses neither Core library objects nor globals that depend on the Core library, such as `HTTP`.

```js
// eslint.config.js
rules: { 'sfmc/ssjs-require-platform-load': 'off' }
```
