# `sfmc/ssjs-arg-types`

> Check that literal arguments match the expected parameter types for SSJS functions and methods.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

Many SSJS functions and methods have documented parameter types (`string`, `number`, `boolean`, `object`, `string[]`, etc.). Passing a literal value of the wrong type (e.g. a number where a string is required) is a common source of runtime errors. This rule validates every literal argument against the expected type declared in the ssjs-data catalog.

Only literal values are checked — variables, function call results, and other non-literal expressions are always treated as valid because their types cannot be determined statically.

## Coverage

| Namespace | Example |
|---|---|
| `Platform.Function.*` | `Platform.Function.Lookup("MyDE", "Value", "Key", 42)` |
| `Platform.Variable.*` | `Platform.Variable.SetValue("varName", value)` |
| `Platform.Response.*` | `Platform.Response.SetResponseHeader("X-Header", 123)` |
| `Platform.Request.*` | `Platform.Request.GetQueryStringParameter(0)` |
| `Platform.Recipient.*` | `Platform.Recipient.GetAttributeValue(true)` |
| `HTTP.*` | `HTTP.Get(42)` |
| `HTTPHeader.*` | `HTTPHeader.SetValue("Content-Type", value)` |
| `Attribute.*` | `Attribute.GetValue(false)` |
| `WSProxy` instance methods | `proxy.retrieve(42, fieldArray, filter)` |
| Core Library static | `DataExtension.Init(123)` |
| Core Library instance | `de.Add(true)` |
| Global (`Format`, `String`, `Error`) | `Format(42, true)` |

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

## Examples

**Not allowed:**

```js
/* Platform.Function.Lookup expects string for first arg */
var val = Platform.Function.Lookup(42, "Value", "Key", keyValue);

/* DataExtension.Init expects a string name, not a number */
var de = DataExtension.Init(123);

/* BounceEvent.Retrieve expects an object filter, not a string */
var rows = BounceEvent.Retrieve("all");
```

**Allowed:**

```js
var val = Platform.Function.Lookup("MyDE", "Value", "Key", keyValue);

var de = DataExtension.Init("MyDE");

var rows = BounceEvent.Retrieve({ Property: "ID", SimpleOperator: "isNotNull", Value: "" });
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-arg-types': 'off' }
```
