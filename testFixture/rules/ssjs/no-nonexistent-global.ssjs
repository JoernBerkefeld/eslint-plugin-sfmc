/* ── Rule: sfmc/ssjs-no-nonexistent-global ──────────────────────────────────────
   Flags bare-name SSJS globals that are officially documented but do not exist at
   runtime (calling them throws a ReferenceError).
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

/* ✅ ACCEPTED — Platform.Response.Redirect is the runtime-safe alternative */
Platform.Response.Redirect("https://example.com", false);

/* ❌ FAIL — bare-name Redirect does not exist at runtime; use Platform.Response.Redirect */
Redirect("https://example.com", false);
