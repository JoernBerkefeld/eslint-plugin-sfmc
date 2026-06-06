/* ── MCE mode · SSJS test fixture ──────────────────────────────────────────────
   Expected diagnostics are noted on the lines that should trigger them.
   Open this file in VS Code — the ESLint extension shows live squiggles.
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

/* ✅ Valid platform function call */
var de = Platform.Function.CreateObject("DataExtension");

/* ✅ Valid WSProxy call */
var proxy = new Script.Util.WSProxy();
var result = proxy.retrieve("DataExtension", ["CustomerKey", "Name"]);

/* ❌ Unknown Platform.Function → [ssjs-no-unknown-function] error */
var bad = Platform.Function.DoesNotExistMethod("arg");

/* ❌ Wrong arity for Platform.Function.CreateObject → [ssjs-platform-function-arity] error */
var wrongArity = Platform.Function.CreateObject("DataExtension", "extra");

/* ❌ Missing Platform.Load before use is detected above but note the order matters */
/* ❌ for loop with .length not cached → [ssjs-cache-loop-length] warning */
var arr = [1, 2, 3];
for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
}
