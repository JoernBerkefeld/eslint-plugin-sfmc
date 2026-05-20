# ssjs-no-deprecated-function

Flags calls to deprecated SFMC SSJS APIs. Currently focuses on the **Content Areas** feature,
which has been retired and no longer allows creating or updating content.

## What is flagged

| API | Reason |
|---|---|
| `ContentArea(…)` | Global alias; Content Areas are deprecated |
| `ContentAreaByName(…)` | Global alias; Content Areas are deprecated |
| `Platform.Function.ContentArea(…)` | Content Areas are deprecated |
| `Platform.Function.ContentAreaByName(…)` | Content Areas are deprecated |
| `ContentAreaObj.Init(…)` | ContentAreaObj class is deprecated |
| `ContentAreaObj.Add(…)` | ContentAreaObj class is deprecated |
| `ContentAreaObj.Retrieve(…)` | ContentAreaObj class is deprecated |
| `<contentAreaVar>.Update(…)` | Instance method on a deprecated ContentAreaObj variable |
| `<contentAreaVar>.Remove()` | Instance method on a deprecated ContentAreaObj variable |

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
