# `sfmc/ssjs-no-unknown-core-method`

> Disallow calls to methods that don't exist on a Core library object.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | — |

## Why This Rule Exists

When a variable is initialised with a known Core library constructor (e.g. `var de = DataExtension.Init("MyDE")`), only the methods documented for that Core object type should be called on it. Calling an undocumented or misspelled method causes a runtime error. This rule infers the object type from the `.Init()` call and validates subsequent method calls.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
Platform.Load("core", "1.1.5");
var de = DataExtension.Init("MyDE");
de.Execute();  /* 'Execute' is not a method of DataExtension */
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");
var de = DataExtension.Init("MyDE");
var rows = de.Rows.Retrieve();
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unknown-core-method': 'off' }
```
