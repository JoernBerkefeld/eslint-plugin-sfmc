# `sfmc/ssjs-no-unknown-wsproxy-method`

> Disallow unknown method calls on a `WSProxy` instance.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | — |

## Why This Rule Exists

`WSProxy` is SFMC's SSJS wrapper around the SOAP API. It exposes a specific set of methods (`retrieve`, `retrieveAll`, `create`, `update`, `delete`, `execute`, `perform`). Calling an unknown method on a `WSProxy` instance causes a runtime error. This rule infers `WSProxy` variable usage and validates method calls against the known list.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
Platform.Load("core", "1.1.5");
var proxy = new Script.Util.WSProxy();
var result = proxy.query({ ObjectType: "Subscriber" });
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");
var proxy = new Script.Util.WSProxy();
var result = proxy.retrieve({ ObjectType: "Subscriber", Properties: ["SubscriberKey"] }, []);
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unknown-wsproxy-method': 'off' }
```
