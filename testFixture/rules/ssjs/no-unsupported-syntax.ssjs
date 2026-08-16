/* ── Rule: sfmc/ssjs-no-unsupported-syntax ─────────────────────────────────────
   Flags ES6+ syntax not supported by SFMC SSJS.
   Note: let/const/?? cause parse errors at ecmaVersion:5 (strict .ssjs config).
   Use testFixture/manual-autofix/ for let/const/?? auto-fix manual tests.
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

/* ✅ ACCEPTED — ES3/ES5 var declarations */
var name = "Jane";
var arr = [1, 2, 3];

/* ❌ FAIL — arrow function: parse error at ecmaVersion:5 (not auto-fixable here) */
var doubledArrow = arr.map(x => x * 2);
