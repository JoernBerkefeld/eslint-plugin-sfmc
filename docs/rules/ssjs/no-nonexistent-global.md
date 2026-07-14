# `sfmc/ssjs-no-nonexistent-global`

Flags bare-name SSJS globals that are officially documented but proven **not to exist
at runtime** — calling them throws a `ReferenceError`. Unlike deprecated APIs (which
still run), these never work.

## What is flagged

| API | Reason |
|---|---|
| `Redirect(url, movedPermanently)` | Not injected by `Platform.Load` under any Core version; calling it throws a `ReferenceError`. Use `Platform.Response.Redirect(url, movedPermanently)` instead. |

The list is driven by `ssjs-data`'s `notDefinedAtRuntime` flag, so new phantom globals
are picked up automatically without editing this rule.

## Examples

### ❌ Incorrect

```js
// Bare-name Redirect does not exist at runtime — throws ReferenceError
Redirect('https://example.com', false);
```

### ✅ Correct

```js
// Platform.Response.Redirect is always available in CloudPages
Platform.Response.Redirect('https://example.com', false);
```

## Rule details

- **Type:** `problem`
- **Fixable:** No
- **Recommended:** Yes
- **Strict:** Yes
