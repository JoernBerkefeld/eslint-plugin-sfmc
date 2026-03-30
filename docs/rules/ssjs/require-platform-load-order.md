# `sfmc/ssjs-require-platform-load-order`

> Require `Platform.Load()` to appear before Core library usage in source order.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

Even when `Platform.Load("core", "1.1.5")` is present in the file, placing it *after* the first Core library call still causes a runtime crash. SFMC executes the file top-to-bottom; a `DataExtension.Init()` call on line 1 runs before the `Platform.Load` on line 10 has had a chance to initialise the Core library. This rule is complementary to [`ssjs-require-platform-load`](require-platform-load.md) — it specifically checks that the call appears in the correct position.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
var de = DataExtension.Init("MyDE");   /* Core used before Platform.Load */
Platform.Load("core", "1.1.5");
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");
var de = DataExtension.Init("MyDE");
```

## When to Disable

Only disable if you have a deliberate top-of-file initialisation pattern that reorders statements at runtime.

```js
// eslint.config.js
rules: { 'sfmc/ssjs-require-platform-load-order': 'off' }
```
