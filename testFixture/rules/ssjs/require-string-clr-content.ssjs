/* ── Rule: sfmc/ssjs-require-string-clr-content ────────────────────────────────
   HttpResponse.content is a CLR string, not a JavaScript string. Using it
   directly (ParseJSON, string methods, concatenation, assignment) is unreliable.
   Fix: wrap it with String(resp.content) before any further use.
   ─────────────────────────────────────────────────────────────────────────── */

var req = new Script.Util.HttpRequest("https://api.example.com/data");
req.method = "GET";
var resp = req.send();

var greq = Script.Util.HttpGet("https://api.example.com/cached");
var gresp = greq.send();

/* ✅ ACCEPTED — content already wrapped in String() before ParseJSON */
var data = Platform.Function.ParseJSON(String(resp.content) + "");

/* ✅ ACCEPTED — content wrapped in String() before a string method */
var head = String(resp.content).substring(0, 10);

/* ✅ ACCEPTED — .content on an object that is not a tracked response */
var config = { content: "static" };
var raw = config.content;

/* ❌ FAIL — content passed to ParseJSON without String() wrap */
var parsed = Platform.Function.ParseJSON(resp.content);

/* ❌ FAIL — content assigned directly to a variable */
var body = resp.content;

/* ❌ FAIL — content concatenated as a string */
var msg = "Body: " + resp.content;

/* ❌ FAIL — string method called directly on content */
var snippet = resp.content.substring(0, 20);

/* ❌ FAIL — HttpGet response content used without String() */
var gbody = Platform.Function.ParseJSON(gresp.content);
