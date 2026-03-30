# `sfmc/amp-function-arity`

> Enforce correct argument counts for known AMPscript functions.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

AMPscript functions have fixed required and optional argument counts documented in the Salesforce catalog. Calling a function with too few arguments causes a runtime error. Calling it with too many can silently truncate or fail. This rule validates every call against the known min/max argument counts.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  /* Lookup requires at least 4 arguments */
  var @val
  set @val = Lookup("MyDE", "Value")

  /* Format accepts at most 3 arguments */
  set @val = Format(@num, "0.00", "en-US", "extra")
]%%
```

**Allowed:**

```ampscript
%%[
  var @val
  set @val = Lookup("MyDE", "Value", "Key", @key)
  set @val = Format(@num, "0.00", "en-US")
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-function-arity': 'off' }
```
