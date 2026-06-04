# `sfmc/ssjs-no-property-call`

Flags `Platform.Request` and `Platform.Response` members that are **properties**, not functions.
Calling them with parentheses `()` is a runtime error — they must be accessed without parentheses.

The rule is fixable:

- **No-arg calls** (`Property()`) → removes the `()` on both `Request` and `Response` properties.
- **Single-arg calls on `Platform.Response.*`** (`ContentType("text/html")`) → rewrites to an assignment (`= value`), because those two properties are read/write.
- **Any-arg calls on `Platform.Request.*`** → reported as an error with no auto-fix, because `Request` properties are read-only.

## Properties affected

### `Platform.Request` — read-only

| Property |
|---|
| `Browser` |
| `ClientIP` |
| `HasSSL` |
| `IsSSL` |
| `Method` |
| `QueryString` |
| `ReferrerURL` |
| `RequestURL` |
| `UserAgent` |

### `Platform.Response` — read/write

| Property |
|---|
| `ContentType` |
| `CharacterSet` |

## Examples

### ❌ Incorrect — reading a property with `()`

```js
var method = Platform.Request.Method();   // ← runtime error
var ip     = Platform.Request.ClientIP(); // ← runtime error
var ct     = Platform.Response.ContentType(); // ← runtime error
```

Auto-fix removes the parentheses:

```js
var method = Platform.Request.Method;
var ip     = Platform.Request.ClientIP;
var ct     = Platform.Response.ContentType;
```

### ❌ Incorrect — setting a `Platform.Response` property via function call

```js
Platform.Response.ContentType("application/json"); // ← should be an assignment
Platform.Response.CharacterSet("UTF-8");           // ← should be an assignment
```

Auto-fix converts to an assignment statement:

```js
Platform.Response.ContentType = "application/json";
Platform.Response.CharacterSet = "UTF-8";
```

### ❌ Incorrect — attempting to set a read-only `Platform.Request` property (no fix)

```js
Platform.Request.Method("POST"); // ← read-only, cannot be set
```

### ✅ Correct

```js
// Reading properties — no parentheses
var method = Platform.Request.Method;
var ip     = Platform.Request.ClientIP;
var ct     = Platform.Response.ContentType;

// Setting writable Response properties — use assignment
Platform.Response.ContentType = "application/json";
Platform.Response.CharacterSet = "UTF-8";

// Calling real methods — parentheses are correct
Platform.Request.GetQueryStringParameter("id");
Platform.Response.Write("<p>Hello</p>");
```

## Rule details

- **Type:** `problem`
- **Fixable:** Yes (`code`)
- **Recommended:** Yes
- **Strict:** Yes
