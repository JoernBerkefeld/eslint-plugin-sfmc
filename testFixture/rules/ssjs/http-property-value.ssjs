/* ── Rule: sfmc/ssjs-http-property-value ───────────────────────────────────────
   Script.Util.HttpRequest / HttpGet instance properties only accept a fixed set
   of values. Literal assignments outside the allowed enum / integer / min are
   flagged (with enum-replacement suggestions). Constraints live in ssjs-data.
   ─────────────────────────────────────────────────────────────────────────── */

var req = new Script.Util.HttpRequest("https://api.example.com/data");
var greq = Script.Util.HttpGet("https://api.example.com/cached");

/* ✅ ACCEPTED — valid method enum value */
req.method = "POST";

/* ✅ ACCEPTED — valid emptyContentHandling enum value */
req.emptyContentHandling = 1;

/* ✅ ACCEPTED — valid non-negative integer retries */
req.retries = 3;

/* ✅ ACCEPTED — non-literal assignment cannot be verified statically */
req.method = someVar;

/* ✅ ACCEPTED — assignment on an object that is not a tracked request */
var config = { method: "POT" };
config.method = "POT";

/* ❌ FAIL — emptyContentHandling outside 0 | 1 | 2 */
req.emptyContentHandling = 5;

/* ❌ FAIL — retries must be a non-negative integer */
req.retries = -2.45;

/* ❌ FAIL — invalid method enum value */
req.method = "POT";

/* ❌ FAIL — invalid value on an HttpGet instance */
greq.emptyContentHandling = 9;
