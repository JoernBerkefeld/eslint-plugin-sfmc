# `sfmc/ssjs-no-unknown-function`

Flags calls to SFMC API methods that do not exist in the catalog. This single rule replaces the seven narrow `no-unknown-*` rules from earlier versions of the plugin.

When targeting **Marketing Cloud Next**, SSJS is not supported at all. Set `target: 'next'` to flag every SSJS API call as an error, signalling that the SSJS block must be removed or rewritten in AMPscript.

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `'engagement'` \| `'next'` | — | Target platform. Set to `'next'` to flag every SSJS API call (all of `Platform.*`, `HTTP.*`, Core Library, and WSProxy) as unsupported in Marketing Cloud Next. |

## Examples

### Standard usage (Marketing Cloud Engagement)

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

### MCN target (`target: 'next'`)

SSJS is not supported in Marketing Cloud Next. Configuring `target: 'next'` flags every SFMC API call within SSJS files, indicating they must be rewritten or removed.

```js
// eslint.config.js
rules: {
  'sfmc/ssjs-no-unknown-function': ['error', { target: 'next' }]
}
```

Or use the built-in `recommended-next` / `strict-next` / `embedded-next` configs which apply this automatically (and disable all other SSJS quality rules, since the entire SSJS block must be migrated).

#### ❌ Flagged (with `target: 'next'`)

```js
// All SFMC API calls are flagged — SSJS is not available in MCN
Platform.Function.LookupRows('MyDE', 'Status', 'Active');

var de = DataExtension.Init('CustomerData');
de.Rows.Retrieve();
```

## When to use

Enable this rule to catch typos, outdated method names, and unsupported API calls before they cause runtime failures. Use `target: 'next'` when migrating content to Marketing Cloud Next.

## Rule details

- **Type:** `problem`
- **Fixable:** No
- **Recommended:** Yes (`engagement` mode)
- **Strict:** Yes (`engagement` mode)
- **`recommended-next` / `strict-next` / `embedded-next`:** Yes (`next` mode — all other SSJS rules disabled)
