# ssjs-no-unknown-function

Flags calls to SFMC API methods that do not exist in the catalog. This single rule replaces the seven narrow `no-unknown-*` rules from earlier versions of the plugin.

## Covered namespaces

| Namespace | Example |
|---|---|
| `Platform.Function` | `Platform.Function.LookupRows(…)` |
| `Platform.Variable` | `Platform.Variable.GetValue(…)` |
| `Platform.Request` | `Platform.Request.GetQueryStringParameter(…)` |
| `Platform.Response` | `Platform.Response.Write(…)` |
| `Platform.Recipient` | `Platform.Recipient.GetAttributeValue(…)` |
| `HTTP` | `HTTP.Get(…)` |
| Core Library instance methods | `de.Rows.Retrieve()` (tracked from `DataExtension.Init(…)`) |
| WSProxy instance methods | `api.retrieve(…)` (tracked from `new Script.Util.WSProxy()`) |

## Examples

### ❌ Incorrect

```js
// Typo in Platform.Function method name
Platform.Function.FetchRows('MyDE', 'Status', 'Active');

// Non-existent WSProxy method
var api = new Script.Util.WSProxy();
api.getAllResults({ ObjectType: 'DataExtension' });

// Unknown Core Library method on a DataExtension instance
var de = DataExtension.Init('CustomerData');
de.ExportRows();
```

### ✅ Correct

```js
Platform.Function.LookupRows('MyDE', 'Status', 'Active');

var api = new Script.Util.WSProxy();
api.retrieve({ ObjectType: 'DataExtension' }, ['CustomerKey', 'Name'], {});

var de = DataExtension.Init('CustomerData');
de.Rows.Retrieve();
```

## When to use

Enable this rule to catch typos, outdated method names, and unsupported API calls before
they cause runtime failures.

## Rule details

- **Type:** `problem`
- **Fixable:** No
- **Recommended:** Yes
- **Strict:** Yes
