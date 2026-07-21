/* ── Rule: sfmc/ssjs-platform-function-arity ────────────────────────────────────
   Flags Platform.Function calls with the wrong number of arguments.
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

/* ✅ ACCEPTED — CreateObject takes exactly 1 argument (the object type string) */
var de = Platform.Function.CreateObject("DataExtension");

/* ✅ ACCEPTED — AddObjectArrayItem takes exactly 3 arguments */
var arrObj = Platform.Function.CreateObject("DataExtensionObject");
Platform.Function.AddObjectArrayItem(de, "Fields", arrObj);

/* ❌ FAIL — CreateObject called with no arguments (requires 1) */
var badDe = Platform.Function.CreateObject();

/* ❌ FAIL — CreateObject called with too many arguments (max is 1) */
var badDe2 = Platform.Function.CreateObject("DataExtension", "extra");

/* ✅ ACCEPTED — HTTPGet discontinuous overload: the 1-argument form is valid */
var body = Platform.Function.HTTPGet("https://api.example.com/data");

/* ✅ ACCEPTED — HTTPGet discontinuous overload: the full 6-argument form is valid */
var status = [];
var full = Platform.Function.HTTPGet(
    "https://api.example.com/data",
    false,
    0,
    null,
    null,
    status
);

/* ❌ FAIL — HTTPGet with 2 args is inside [1,6] but not a valid arity (only 1 or 6) */
var bad2 = Platform.Function.HTTPGet("https://api.example.com/data", false);

/* ❌ FAIL — HTTPGet with 4 args is inside [1,6] but not a valid arity (only 1 or 6) */
var bad4 = Platform.Function.HTTPGet("https://api.example.com/data", false, 0, null);
