# `sfmc/ssjs-no-unknown-function`

Flags calls to SFMC API methods that do not exist in the catalog. This single rule replaces the seven narrow `no-unknown-*` rules from earlier versions of the plugin.

This rule only reports **unknown** method names. When targeting Marketing Cloud Next, SSJS is not supported at all — every SSJS API call is flagged by the dedicated [`sfmc/ssjs-no-mcn-unsupported`](no-mcn-unsupported.md) rule instead.

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

## Options

This rule takes no options.

## Examples

#### ❌ Incorrect

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

#### ✅ Correct

```js
Platform.Function.LookupRows('MyDE', 'Status', 'Active');

var api = new Script.Util.WSProxy();
api.retrieve({ ObjectType: 'DataExtension' }, ['CustomerKey', 'Name'], {});

var de = DataExtension.Init('CustomerData');
de.Rows.Retrieve();
```

## When to use

Enable this rule to catch typos and outdated method names before they cause runtime failures. When migrating content to Marketing Cloud Next, use [`sfmc/ssjs-no-mcn-unsupported`](no-mcn-unsupported.md) (applied automatically by the `recommended-next` / `strict-next` / `embedded-next` configs).

## Rule details

- **Type:** `problem`
- **Fixable:** No
- **Recommended:** Yes (`engagement` mode)
- **Strict:** Yes (`engagement` mode)
- **`recommended-next` / `strict-next` / `embedded-next`:** Off (superseded by `ssjs-no-mcn-unsupported`)
