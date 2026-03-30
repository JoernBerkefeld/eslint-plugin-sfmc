# `sfmc/ssjs-platform-function-arity`

> Enforce correct argument counts for `Platform.Function.*` calls.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

`Platform.Function` methods have documented required and optional argument counts. Passing too few arguments causes a runtime error; passing too many may silently truncate or fail. This rule validates every `Platform.Function.*` call against the known min/max argument counts.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
Platform.Load("core", "1.1.5");
/* Lookup requires at least 4 arguments */
var val = Platform.Function.Lookup("MyDE", "Value");
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");
var val = Platform.Function.Lookup("MyDE", "Value", "Key", keyValue);
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-platform-function-arity': 'off' }
```
