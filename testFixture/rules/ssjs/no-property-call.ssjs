/* ── Rule: sfmc/ssjs-no-property-call ──────────────────────────────────────────
   Platform.Request/Response properties must not be called as functions.
   Auto-fix: remove () on read; convert Response setter call to assignment.
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

/* ✅ ACCEPTED — reading a property without () */
var method = Platform.Request.Method;
var body = Platform.Request.Body;

/* ✅ ACCEPTED — setting a writable Response property via assignment */
Platform.Response.ContentType = "application/json";

/* ❌ FAIL (auto-fixable) — property read with () */
var badMethod = Platform.Request.Method();

/* ❌ FAIL (auto-fixable) — Response setter via function call */
Platform.Response.ContentType("application/json");

/* ❌ FAIL (auto-fixable) — setter inside comma expression */
Platform.Response.CharacterSet("UTF-8"), Platform.Response.Write("ok");
