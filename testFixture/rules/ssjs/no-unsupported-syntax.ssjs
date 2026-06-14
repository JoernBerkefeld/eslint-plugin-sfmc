/* ── Rule: sfmc/ssjs-no-unsupported-syntax ─────────────────────────────────────
   Flags ES6+ syntax not supported by SFMC SSJS.
   Auto-fix (when parseable): direct object return → var + return.
   Note: let/const/?? cause parse errors at ecmaVersion:5 (strict .ssjs config).
   Use testFixture/manual-autofix/ for let/const/?? auto-fix manual tests.
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

/* ✅ ACCEPTED — ES3/ES5 var declarations */
var name = "Jane";
var arr = [1, 2, 3];

/* ❌ FAIL (auto-fixable at ecmaVersion:5) — direct object literal return */
function buildPayload() {
    return { id: 1, label: name };
}

/* ❌ FAIL — arrow function: parse error at ecmaVersion:5 (not auto-fixable here) */
var doubledArrow = arr.map(x => x * 2);
