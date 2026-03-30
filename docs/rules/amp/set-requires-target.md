# `sfmc/amp-set-requires-target`

> Require `set` statements to have a target variable.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

The correct form of a `set` statement is `set @variable = expression`. A bare `set = expression` with no target is either a parse error or produces undefined runtime behavior. This always indicates a typo or incomplete code.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  set = Lookup("MyDE", "Value", "Key", @key)
]%%
```

**Allowed:**

```ampscript
%%[
  var @result
  set @result = Lookup("MyDE", "Value", "Key", @key)
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-set-requires-target': 'off' }
```
