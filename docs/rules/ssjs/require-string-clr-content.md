# `sfmc/ssjs-require-string-clr-content`

Requires wrapping the `content` property of an `HttpResponse` with `String()` before
use — the object returned by `req.send()` on a `Script.Util.HttpRequest` or
`Script.Util.HttpGet`.

`resp.content` is a Common Language Runtime (CLR) string, **not** a native JavaScript
string. Passing it directly to `Platform.Function.ParseJSON()`, calling a string
method on it, concatenating it, or assigning it to a variable used as a string is
unreliable in the SFMC SSJS (ES3/CLR) engine. The verified fix is to convert it with
`String(resp.content)` first:

```js
var responseJSON = Platform.Function.ParseJSON(String(resp.content));
```

## Detection

The rule tracks data flow, so it only fires on a genuine response object:

1. A **request** variable is one assigned from `new Script.Util.HttpRequest(...)`
   or `Script.Util.HttpGet(...)`.
2. A **response** variable is one assigned from `<requestVar>.send()`.
3. Any read of `<responseVar>.content` that is **not** already the direct argument
   of a `String(...)` call is flagged.

`.content` access on any other object is ignored, so there are no false positives on
unrelated `content` properties.

## Examples

### ❌ Incorrect — raw CLR content used directly

```js
var req = new Script.Util.HttpRequest("https://api.example.com/data");
var resp = req.send();

var parsed = Platform.Function.ParseJSON(resp.content); // ← unreliable
var body   = resp.content;                              // ← unreliable
var msg    = "Body: " + resp.content;                   // ← unreliable
var head   = resp.content.substring(0, 20);             // ← unreliable
```

### ✅ Correct — wrap with `String()` first

```js
var req = new Script.Util.HttpRequest("https://api.example.com/data");
var resp = req.send();

var parsed = Platform.Function.ParseJSON(String(resp.content));
var body   = String(resp.content);
var head   = String(resp.content).substring(0, 20);
```

## Fix (auto-fix)

The rule is auto-fixable: it wraps the flagged `<resp>.content` access in
`String(...)`. For example `ParseJSON(resp.content)` becomes
`ParseJSON(String(resp.content))`.

The same diagnostic and quick-fix are available in the VS Code / Cursor extension
(`ssjs/clr-content-access`).

## Rule details

- **Type:** `problem`
- **Fixable:** Yes (`code`)
- **Recommended:** Yes (`error`)
- **Strict:** Yes (`error`)
