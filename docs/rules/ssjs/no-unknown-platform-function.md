# `sfmc/ssjs-no-unknown-platform-function`

> Disallow calls to unknown `Platform.Function.*` methods.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

`Platform.Function` exposes a fixed set of SFMC server-side utility functions (e.g. `Platform.Function.Lookup`, `Platform.Function.InsertData`). Calling a method that does not exist in the catalog causes a runtime error. This rule validates every `Platform.Function.*` call against the known list.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
Platform.Load("core", "1.1.5");
var result = Platform.Function.CustomQuery("MyDE");
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");
var result = Platform.Function.Lookup("MyDE", "Value", "Key", keyValue);
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unknown-platform-function': 'off' }
```
