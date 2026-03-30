# `sfmc/ssjs-no-unknown-platform-request`

> Disallow unknown `Platform.Request.*` method calls.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

`Platform.Request` exposes a fixed set of methods for reading incoming HTTP request data on CloudPages and landing pages (e.g. `Platform.Request.GetQueryStringParameter`, `Platform.Request.GetFormField`). Calling an unknown method causes a runtime error. This rule validates every `Platform.Request.*` call against the known list.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
var val = Platform.Request.ReadParam("myParam");
```

**Allowed:**

```js
var val = Platform.Request.GetQueryStringParameter("myParam");
var field = Platform.Request.GetFormField("email");
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unknown-platform-request': 'off' }
```
