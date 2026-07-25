# `sfmc/ssjs-no-nonfunctional-method`

> Warn when calling a Core Library method that resolves at runtime but has no known working invocation.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

A few Core Library methods **exist** and **resolve** at runtime — the namespace or instance exposes them as callables — but exhaustive live testing has found **no working invocation**: every attempted call fails (returns the string `"Error"` or throws), and the documented success path could not be reproduced.

Because these methods DO exist, they remain in completions and in the generated `.d.ts` (unlike nonexistent members). This rule warns at the **call site** so you know the call will not work at runtime, using the `nonFunctionalAtRuntime` flag from the ssjs-data catalog.

## Coverage

Both **static** and **instance** call styles are covered, mirroring `sfmc/ssjs-core-method-arity`:

| Style | Example |
|---|---|
| Instance | `var fd = FilterDefinition.Init("x"); fd.Update({});` |
| Static single-name | `FilterDefinition.Update({});` |
| Static multi-part | `DataExtension.Rows.Add(rowObj);` |

Flagged methods today: `FilterDefinition.Update`, `FilterDefinition.Remove`.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

## Examples

**Not allowed:**

```js
Platform.Load("core", "1.1.5");

var fd = FilterDefinition.Init("my-filter");

/* FilterDefinition.Update has no known working invocation at runtime */
fd.Update({ Name: "renamed" });

/* FilterDefinition.Remove has no known working invocation at runtime */
fd.Remove();
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");

var fd = FilterDefinition.Init("my-filter");

/* Add, Init, Retrieve are working invocations */
fd.Retrieve();
fd.Add(filterDefinitionObj);
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-nonfunctional-method': 'off' }
```
