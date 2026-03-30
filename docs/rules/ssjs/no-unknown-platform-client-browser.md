# `sfmc/ssjs-no-unknown-platform-client-browser`

> Disallow unknown `Platform.ClientBrowser.*` method calls.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

`Platform.ClientBrowser` exposes a small, fixed set of methods for writing to and redirecting the HTTP response on CloudPages and landing pages. Calling a method that does not exist in this catalog causes a runtime error. This rule validates every `Platform.ClientBrowser.*` call against the known list.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
Platform.ClientBrowser.Send("data");
```

**Allowed:**

```js
Platform.ClientBrowser.Redirect("https://example.com");
Platform.ClientBrowser.Write("<p>Hello</p>");
Platform.ClientBrowser.SetCookie("session", "abc123");
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unknown-platform-client-browser': 'off' }
```
