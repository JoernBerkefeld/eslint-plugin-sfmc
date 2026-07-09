# `sfmc/ssjs-no-mcn-unsupported`

> Disallow all Server-Side JavaScript API usage, which is unavailable in Marketing Cloud Next.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in all `-next` configs; `off` otherwise |
| **Fixable** | — |

## Why This Rule Exists

Server-Side JavaScript is not available in Marketing Cloud Next (MCN) at all. When targeting MCN, every SSJS API usage must be rewritten in AMPscript or Handlebars. This rule flags all SSJS API surface usage:

| Construct | Example |
|---|---|
| Any `Platform.*` call (incl. `Platform.Load`) | `Platform.Function.LookupRows(…)` |
| Any `HTTP.*` call | `HTTP.Get(…)` |
| Core Library instance calls | `de.Rows.Retrieve()` (tracked from `DataExtension.Init(…)`) |
| WSProxy instance calls | `api.retrieve(…)` |
| WSProxy construction | `new Script.Util.WSProxy()` |

Unlike [`sfmc/ssjs-no-unknown-function`](no-unknown-function.md), which only flags method names not in the catalog, this rule flags **every** SFMC API call — the whole SSJS block must be migrated.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` in `-next` configs |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiVersion` | `number` | — | Accepted for parity with the AMPscript and Handlebars MCN rules; currently has **no effect** because no MCN API version supports SSJS. |

## Examples

```js
// eslint.config.js
rules: {
  'sfmc/ssjs-no-mcn-unsupported': 'error'
}
```

Or use the built-in `recommended-next` / `strict-next` / `embedded-next` configs, which apply this rule automatically (and disable the other SSJS quality rules, since the entire block must be migrated).

**Flagged (every API call):**

```js
Platform.Load('Core', '1.1.1');
Platform.Function.LookupRows('MyDE', 'Status', 'Active');

var de = DataExtension.Init('CustomerData');
de.Rows.Retrieve();

var api = new Script.Util.WSProxy();
api.retrieve({ ObjectType: 'DataExtension' }, ['CustomerKey'], {});
```

## When to Disable

Disable this rule when you are not targeting Marketing Cloud Next (the default `engagement` configs already leave it `off`).

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-mcn-unsupported': 'off' }
```
