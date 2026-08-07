# `sfmc/ssjs-no-invalid-property-access`

Flags property accesses that go against the direction the SFMC runtime actually supports —
reading a property that can only be written, or writing one that can only be read.

The restriction lives in [`ssjs-data`](../../../..) as an `access` field on the property
entry (exposed via `propertyAccessLookup`), so this rule and the VS Code / Cursor
diagnostic (`ssjs/invalid-property-access`) share one source of truth, and flagging a
future property is a one-field data change.

## The three restrictions

| `access` | Runtime behaviour | Flagged usage | Members |
| --- | --- | --- | --- |
| `write-only` | Assignment works; reading throws `"Property Get method was not found."` — outside a `try`/`catch` that throw aborts the whole page | read | `Script.Util.HttpRequest.postData` |
| `write-only-opaque` | Assignment works; reading returns an opaque CLR value instead of the assigned string (no throw) | read | `Platform.Response.ContentType`, `Platform.Response.CharacterSet` |
| `read-only` | Reading works; assignment is silently ineffective | write | `Platform.Request.Browser`, `ClientIP`, `HasSSL`, `IsSSL`, `Method`, `QueryString`, `ReferrerURL`, `RequestURL`, `UserAgent` |

## Detection

The rule tracks data flow for HTTP instances, so it only fires on a genuine request object:

1. A **request** variable is one assigned from `new Script.Util.HttpRequest(...)` or
   `Script.Util.HttpGet(...)`. A property read on an untracked variable is ignored.
2. `Platform.Request.*` / `Platform.Response.*` are matched on the literal member path.
3. A member expression that is the left-hand side of an assignment counts as a **write**;
   any other member access counts as a **read**.

Related: [`sfmc/ssjs-no-property-call`](no-property-call.md) reports the *call* form of a
read-only write (`Platform.Request.Method("POST")`). This rule handles the *assignment*
form (`Platform.Request.Method = "POST"`), which that rule does not see. There is no
overlap.

## Examples

### ❌ Incorrect

```js
var req = new Script.Util.HttpRequest("https://api.example.com/data");
req.postData = Stringify(payload);
Write(req.postData); // ← throws and aborts the page

var contentType = Platform.Response.ContentType; // ← opaque CLR value, not the assigned string

Platform.Request.Method = "POST"; // ← read-only, has no effect
```

### ✅ Correct

```js
var req = new Script.Util.HttpRequest("https://api.example.com/data");
var body = Stringify(payload);
req.postData = body;
Write(body); // keep your own variable

Platform.Response.ContentType = "application/json";

var method = String(Platform.Request.Method);
```

## Fix

Not fixable and no suggestions — the correct fix is to keep the value in your own
JavaScript variable (or to drop the ineffective assignment), which is a refactor rather
than a mechanical edit.

## Rule details

- **Type:** `problem`
- **Fixable:** No
- **Recommended:** Yes (`error`)
- **Strict:** Yes (`error`)
- **MCN:** Off (SSJS is not supported on Marketing Cloud Next)
