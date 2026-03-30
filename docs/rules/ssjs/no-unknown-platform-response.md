# `sfmc/ssjs-no-unknown-platform-response`

> Disallow unknown `Platform.Response.*` method calls.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

`Platform.Response` exposes a fixed set of methods for controlling HTTP responses from CloudPages and landing pages (e.g. `Platform.Response.Write`, `Platform.Response.Redirect`). Calling an unknown method causes a runtime error. This rule validates every `Platform.Response.*` call against the known list.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
Platform.Response.Send("text/html", "<p>Hello</p>");
```

**Allowed:**

```js
Platform.Response.Write("<p>Hello</p>");
Platform.Response.Redirect("https://example.com");
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unknown-platform-response': 'off' }
```
