# `sfmc/ssjs-http-property-value`

Flags literal assignments to writable `Script.Util.HttpRequest` / `Script.Util.HttpGet`
instance properties whose value violates the property's documented, runtime-confirmed
constraint (allowed enum, integer-ness, or minimum).

Several request properties only accept a fixed set of values. Assigning something outside
that set throws or silently misbehaves in the SFMC SSJS engine:

| Property | Allowed values |
|---|---|
| `method` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| `emptyContentHandling` | `0`, `1`, `2` |
| `retries` | non-negative integer |
| `timeout` | non-negative integer |

The allowed values live in [`ssjs-data`](../../../..) (`SCRIPT_UTIL_REQUEST_PROPERTIES` /
`SCRIPT_UTIL_HTTPGET_PROPERTIES` → `valueConstraint`), so this rule and the VS Code /
Cursor diagnostic (`ssjs/invalid-http-property-value`) share one source of truth.

## Detection

The rule tracks data flow, so it only fires on a genuine request object:

1. A **request** variable is one assigned from `new Script.Util.HttpRequest(...)` or
   `Script.Util.HttpGet(...)`.
2. An assignment `<requestVar>.<prop> = <literal>` where `<prop>` has a `valueConstraint`
   and the right-hand side is a **literal** (string, number, or a negative numeric like
   `-2.45`) is validated against the constraint.

Only literal values are checked. Variable / expression assignments cannot be verified
statically and are left alone to avoid false positives.

## Examples

### ❌ Incorrect

```js
var req = new Script.Util.HttpRequest("https://api.example.com/data");

req.emptyContentHandling = 5;   // ← allowed: 0 | 1 | 2
req.retries = -2.45;            // ← must be a non-negative integer
req.method = 'POT';             // ← allowed: GET | POST | PUT | PATCH | DELETE
```

### ✅ Correct

```js
var req = new Script.Util.HttpRequest("https://api.example.com/data");

req.emptyContentHandling = 1;
req.retries = 3;
req.method = 'POST';
```

## Fix (suggestions)

For enum violations the rule offers a suggestion per allowed value (e.g. replace `'POT'`
with `'GET'`, `'POST'`, …). Numeric violations are reported without an automatic
replacement, since there is no single unambiguous valid value.

The same diagnostic and quick-fix are available in the VS Code / Cursor extension
(`ssjs/invalid-http-property-value`).

## Rule details

- **Type:** `problem`
- **Fixable:** No (offers suggestions)
- **Recommended:** Yes (`error`)
- **Strict:** Yes (`error`)
- **MCN:** Off (SSJS is not supported on Marketing Cloud Next)
