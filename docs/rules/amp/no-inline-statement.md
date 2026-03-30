# `sfmc/amp-no-inline-statement`

> Disallow control-flow statements inside inline expressions (`%%=…=%%`).

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | — |

## Why This Rule Exists

Inline expressions (`%%=…=%%`) are designed to output a single value. Placing `IF`, `FOR`, `SET`, or `VAR` statements inside them is not supported by the AMPscript parser and causes a parse or runtime error. These constructs belong in block AMPscript (`%%[…]%%`).

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%=IF(@x == 1) THEN "yes" ELSE "no" ENDIF=%%

%%=SET @name = "Alice"=%%
```

**Allowed:**

```ampscript
%%[
  if @x == 1 then
    set @out = "yes"
  else
    set @out = "no"
  endif
]%%
%%=v(@out)=%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-inline-statement': 'off' }
```
