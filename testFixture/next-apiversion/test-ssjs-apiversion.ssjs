/* ── ssjs-no-mcn-unsupported · apiVersion 65 (Winter '26) ─────────────────────
   This folder's eslint.config.mjs passes apiVersion: 65 to the SSJS MCN rule.
   SSJS is not available in any Marketing Cloud Next API version, so apiVersion
   has NO effect here: every SFMC API surface usage is flagged regardless of the
   targeted version. Plain JavaScript that does not touch the SFMC API is left
   alone.
   ────────────────────────────────────────────────────────────────────────── */

/* ❌ Platform namespace call → [ssjsNotSupportedInMcn] */
Platform.Load("Core", "1.1.1");

/* ❌ Platform.Function call → [ssjsNotSupportedInMcn] */
var value = Platform.Function.Lookup("MyDE", "Field", "Key", "Value");

/* ❌ HTTP call → [ssjsNotSupportedInMcn] */
var page = HTTP.Get("https://example.com");

/* ❌ Core Library instance call → [ssjsNotSupportedInMcn] */
var de = DataExtension.Init("MyDE");
var rows = de.Rows.Retrieve();

/* ❌ WSProxy construction → [ssjsNotSupportedInMcn] */
var api = new Script.Util.WSProxy();
/* ❌ WSProxy instance call → [ssjsNotSupportedInMcn] */
var result = api.retrieve("DataExtension", ["Name"], {});

/* ✅ Plain JavaScript with no SFMC API is not flagged */
var greeting = "Hello " + "world";
var upper = greeting.toUpperCase();
