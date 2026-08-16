/* ── Rule: sfmc/ssjs-no-switch-default ──────────────────────────────────────────
   A `break` inside a function-scoped `switch` can abnormally complete the function
   in SFMC SSJS (Jint bug jint#2607), skipping code after the `switch` — often the
   `default` fallback. Flagging `default` is a heuristic hint to avoid that shape;
   prefer a lookup map or `if`/`else if` for critical control flow.
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

var status = "active";

/* ✅ ACCEPTED — no default clause to lean on */
switch (status) {
    case "active":
        Write("Active");
        break;
    case "inactive":
        Write("Inactive");
        break;
    case "pending":
        Write("Pending");
        break;
}

/* ❌ FAIL — relies on `default`; the shape most likely to hit the break-escape bug */
switch (status) {
    case "active":
        Write("Active");
        break;
    default:
        Write("Unknown status: " + status);
}
