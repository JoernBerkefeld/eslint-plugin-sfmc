# `sfmc/ssjs-no-deprecated-function`

Flags calls to deprecated SFMC SSJS APIs, chiefly legacy **Classic Content / Classic
Email Studio** Core Library classes (Content Areas, Portfolios, Templates, Sends, and
Send Definitions), which have been superseded by Content Builder and Journey Builder,
plus the legacy `ErrorUtil` helper that only exists under the oldest Core version.

## What is flagged

| API | Reason |
|---|---|
| `ContentArea(…)` | Global alias; Content Areas are deprecated |
| `ContentAreaByName(…)` | Global alias; Content Areas are deprecated |
| `Platform.Function.ContentArea(…)` | Content Areas are deprecated |
| `Platform.Function.ContentAreaByName(…)` | Content Areas are deprecated |
| `ContentAreaObj.Init(…)` / `.Add(…)` / `.Retrieve(…)` | `ContentAreaObj` class is deprecated |
| `<contentAreaVar>.Update(…)` / `.Remove()` | Instance method on a deprecated `ContentAreaObj` variable |
| `Portfolio.Init(…)` / `.Add(…)` / `.Retrieve(…)` (and instance `.Update(…)` / `.Remove()`) | `Portfolio` class is deprecated (legacy Classic Content) |
| `Template.Init(…)` / `.Add(…)` / `.Retrieve(…)` (and instance `.Update(…)`) | `Template` class is deprecated (legacy Classic Content) |
| `Send.Init(…)` / `.Add(…)` / `.Retrieve(…)` (and instance `.RetrieveLists(…)` / `.Remove()` / `.CancelSend()`) | `Send` class is deprecated (legacy Classic Content send) |
| `Send.Definition.Init(…)` / `.Add(…)` (and instance methods, e.g. `.Send()`) | `Send.Definition` class is deprecated (legacy Classic Content send definition) |
| `Email.*` | `Email` class is deprecated in favor of Content Builder / Journey Builder sends |
| `ErrorUtil.ThrowWSProxyError(…)` | Only exists under `Platform.Load("Core", "1")`; undefined in newer Core versions — check `result.Status` and `throw new Error(…)` instead |

## `ErrorUtil` — two message variants

`ErrorUtil` is bound to a maximum Core version (`maxCoreVersion: "1"` in `ssjs-data`), so
the rule picks its wording from the `Platform.Load("Core", …)` version the file loads:

| Loaded Core version | Message | Meaning |
|---|---|---|
| `"1"`, or no version argument, or no `Platform.Load` at all | *"… is deprecated …"* | The call works today, but the API is retired — migrate away from it |
| Anything above `"1"` (`"1.1.1"`, `"1.1.5"`, `"2"`, …) | *"… is undefined under Platform.Load("Core", "…") …"* | `ErrorUtil` does not exist at runtime — the call throws a `TypeError` |

The applicable load is the nearest preceding `Platform.Load("Core", …)`; when every load
appears after the call, the first one in the file is used (it still governs at runtime).

Because bumping the Core version would break such a file,
[`sfmc/ssjs-prefer-platform-load-version`](./prefer-platform-load-version.md) withholds
its autofix whenever `ErrorUtil` is used.

## Examples

### ❌ Incorrect

```js
// Global alias — deprecated
var html = ContentAreaByName('Public Content/MyBlock');

// Platform.Function — deprecated
var content = Platform.Function.ContentArea(12345);

// ContentAreaObj static method — deprecated
var results = ContentAreaObj.Retrieve({
    Property: 'CustomerKey',
    SimpleOperator: 'equals',
    Value: 'myCA',
});

// ContentAreaObj instance — deprecated
var area = ContentAreaObj.Init('myCA');
var status = area.Update({ Name: 'Updated Name' });
```

### ✅ Correct

```js
// Use Content Builder blocks via Platform.Function.ContentBlockByKey / ContentBlockById
var html = Platform.Function.ContentBlockByKey('Public Content/MyBlock');
var content = Platform.Function.ContentBlockById(12345);
```

## Rule details

- **Type:** `suggestion`
- **Fixable:** No
- **Recommended:** Yes
- **Strict:** Yes
