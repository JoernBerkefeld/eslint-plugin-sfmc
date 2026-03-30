# `sfmc/ssjs-no-unknown-platform-variable`

> Disallow unknown `Platform.Variable.*` method calls.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

`Platform.Variable` exposes a fixed set of methods for interacting with AMPscript variables from SSJS (e.g. `Platform.Variable.GetValue`, `Platform.Variable.SetValue`). Calling an unknown method causes a runtime error. This rule validates every `Platform.Variable.*` call against the known list.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
var val = Platform.Variable.ReadValue("@myVar");
```

**Allowed:**

```js
var val = Platform.Variable.GetValue("@myVar");
Platform.Variable.SetValue("@myVar", "Hello");
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unknown-platform-variable': 'off' }
```
