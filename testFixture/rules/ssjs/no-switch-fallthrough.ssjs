/* ── Rule: sfmc/ssjs-no-switch-fallthrough ──────────────────────────────────────
   SFMC SSJS has NO switch fall-through: an empty leading label does not share the
   next label's body, and a break-less body does not cascade into the next case.
   Give every case its own break-terminated body, or use if / a lookup map.
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

var level = "admin";
var access = "";

/* ✅ ACCEPTED — every case has its own break-terminated body */
switch (level) {
    case "admin":
        access = "Full access";
        break;
    case "superuser":
        access = "Full access";
        break;
}

/* ❌ FAIL — empty leading label relies on fall-through into the shared body */
switch (level) {
    case "admin":
    case "superuser":
        access = "Full access";
        break;
}

/* ❌ FAIL — break-less body cascades into the next case */
switch (level) {
    case "admin":
        access = "Admin";
    case "superuser":
        access = "Super";
        break;
}
