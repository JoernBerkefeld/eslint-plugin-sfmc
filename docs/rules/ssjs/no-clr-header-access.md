# `sfmc/ssjs-no-clr-header-access`

Flags CLR-unsafe reads of the `headers` property of an `HttpResponse` — the object
returned by `req.send()` on a `Script.Util.HttpRequest` or `Script.Util.HttpGet`.

`resp.headers` is a Common Language Runtime (CLR) object. Reading an individual
header by indexing it (`resp.headers["Content-Type"]`), or by calling `.Get()` /
`.Item()`, throws at runtime:

```
Use of Common Language Runtime (CLR) is not allowed
```

The only reliable way to read header values is to enumerate `resp.headers` with a
`for..in` loop. Each enumeration key is shaped `"[Name, Value]"`, so the value is
embedded in the key string. The `getHeaderMap()` helper parses those keys into a
plain `{ name: value }` map (with lowercased names).

## Detection

The rule tracks data flow, so it only fires on a genuine response object:

1. A **request** variable is one assigned from `new Script.Util.HttpRequest(...)`
   or `Script.Util.HttpGet(...)`.
2. A **response** variable is one assigned from `<requestVar>.send()`.
3. CLR-style reads of `<responseVar>.headers` are then flagged.

`.headers` access on any other object is ignored, so there are no false positives
on unrelated `headers` properties.

## Examples

### ❌ Incorrect — CLR-style reads throw at runtime

```js
var req = new Script.Util.HttpRequest("https://api.example.com/data");
var resp = req.send();

var ct  = resp.headers["Content-Type"];       // ← throws (CLR not allowed)
var loc = resp.headers.Get("Location");        // ← throws (CLR not allowed)
var enc = resp.headers.Item("Content-Encoding"); // ← throws (CLR not allowed)
```

### ✅ Correct — read via a `getHeaderMap()` helper

```js
/**
 * Build a plain { name: value } header map from an HttpResponse.
 * Reads only the for..in enumeration keys (shaped "[Name, Value]") so it never
 * touches a CLR value — avoiding "Use of Common Language Runtime (CLR) is not allowed".
 * @param {object} resp - the response returned by req.send()
 * @returns {object} map of lowercased header name => value string
 */
function getHeaderMap(resp) {
    var map = {};
    for (var k in resp.headers) {
        var pair = String(k);
        if (pair.charAt(0) === "[") { pair = pair.substring(1); }
        if (pair.charAt(pair.length - 1) === "]") { pair = pair.substring(0, pair.length - 1); }
        var idx = pair.indexOf(", ");
        if (idx > -1) {
            map[pair.substring(0, idx).toLowerCase()] = pair.substring(idx + 2);
        }
    }
    return map;
}

var req = new Script.Util.HttpRequest("https://api.example.com/data");
var resp = req.send();

var headers = getHeaderMap(resp);
var ct = headers["content-type"]; // names are lowercased
```

## Suggestion (quick-fix)

The rule provides a suggestion that:

1. Inserts the `getHeaderMap()` helper once, at the top of the file (skipped if a
   `getHeaderMap(` function already exists).
2. Rewrites the flagged access to `getHeaderMap(<resp>)[<key>]`.

The same diagnostic and quick-fix are available in the VS Code / Cursor extension
(`ssjs/clr-header-access`).

## Rule details

- **Type:** `problem`
- **Fixable:** No (offers a suggestion)
- **Recommended:** Yes (`error`)
- **Strict:** Yes (`error`)
