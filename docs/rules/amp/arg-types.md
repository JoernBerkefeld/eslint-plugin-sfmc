# `sfmc/amp-arg-types`

> Check that literal arguments match the expected parameter types and allowed values for AMPscript functions.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

Some AMPscript function parameters only accept a fixed set of keyword values. For example, the second argument of `DatePart` must be one of `year`, `Y`, `month`, `M`, `monthName`, `day`, `D`, `hour`, `H`, `minute`, or `MI`. Passing any other value is a bug that surfaces only at send/render time.

The Salesforce catalog records these allowed values as an `enum` on the parameter. This rule checks every static literal argument — strings, numbers, and booleans — against the parameter's `enum` (case-insensitive) and reports a mismatch. Variables and expressions are skipped because their value cannot be determined statically.

This rule is the AMPscript counterpart of [`sfmc/ssjs-arg-types`](../ssjs/arg-types.md) and may be expanded later to cover additional argument-type checks.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  /* 'decade' is not a valid datePart */
  set @x = DatePart('2026-01-15', 'decade')

  /* a number is not a valid datePart either */
  set @y = DatePart('2026-01-15', 5)
]%%
```

**Allowed:**

```ampscript
%%[
  /* exact-case enum value */
  set @x = DatePart('2026-01-15', 'Y')

  /* case-insensitive match */
  set @y = DatePart('2026-01-15', 'year')

  /* variable argument — not statically checkable, skipped */
  set @z = DatePart(@d, @part)
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-arg-types': 'off' }
```
