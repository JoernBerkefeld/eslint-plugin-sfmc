# `sfmc/amp-no-loop-counter-assign`

> Disallow assigning to the `for` loop counter variable inside the loop body.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | — |

## Why This Rule Exists

AMPscript documentation explicitly states that modifying the counter variable inside a `FOR … TO … DO` loop is not allowed and causes validation or runtime errors. The counter (`@i` in `FOR @i = 1 TO @n DO`) is managed by the runtime; attempting to reassign it produces undefined behavior.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  for @i = 1 to 10 do
    set @i = Add(@i, 1)
  next @i
]%%
```

**Allowed:**

```ampscript
%%[
  var @step
  for @i = 1 to 10 do
    set @step = Add(@i, 1)
    output(v(@step))
  next @i
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-loop-counter-assign': 'off' }
```
