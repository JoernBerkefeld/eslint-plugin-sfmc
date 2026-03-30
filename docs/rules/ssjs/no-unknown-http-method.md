# `sfmc/ssjs-no-unknown-http-method`

> Disallow unknown `HTTP.*` method calls.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

SFMC's SSJS runtime exposes only four `HTTP` methods: `HTTP.Get`, `HTTP.Post`, `HTTP.GetRequest`, and `HTTP.PostRequest`. Calling any other `HTTP.*` method causes a runtime error. This rule validates every `HTTP.*` call against that fixed list.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
var response = HTTP.Delete("https://api.example.com/resource/1");
var response = HTTP.Patch("https://api.example.com/resource/1", payload);
```

**Allowed:**

```js
var getResponse  = HTTP.Get("https://api.example.com/resource/1");
var postResponse = HTTP.Post("https://api.example.com/resource", payload, contentType);
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unknown-http-method': 'off' }
```
