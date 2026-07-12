/* ── Rule: sfmc/ssjs-no-clr-header-access ──────────────────────────────────────
   HttpResponse.headers is a CLR object. Indexing it, or calling .Get()/.Item(),
   throws "Use of Common Language Runtime (CLR) is not allowed" at runtime.
   Suggestion: insert getHeaderMap() helper and read via getHeaderMap(resp)[…].
   ─────────────────────────────────────────────────────────────────────────── */

var req = new Script.Util.HttpRequest("https://api.example.com/data");
req.method = "GET";
var resp = req.send();

var greq = Script.Util.HttpGet("https://api.example.com/cached");
var gresp = greq.send();

/* ✅ ACCEPTED — reading headers via a for..in map (never touches a CLR value) */
var map = {};
for (var k in resp.headers) {
    if (resp.headers.hasOwnProperty(k)) {
        map[String(k)] = 1;
    }
}

/* ✅ ACCEPTED — .headers access on an object that is not a tracked response */
var config = { headers: {} };
var x = config.headers["Content-Type"];

/* ❌ FAIL — computed index read of a tracked response's headers */
var ct = resp.headers["Content-Type"];

/* ❌ FAIL — CLR .Get() call on a tracked response's headers */
var loc = resp.headers.Get("Location");

/* ❌ FAIL — CLR .Item() call on a tracked response's headers */
var enc = resp.headers.Item("Content-Encoding");

/* ❌ FAIL — headers of an HttpGet response indexed directly */
var gct = gresp.headers["Content-Type"];
