# `sfmc/amp-no-var-redeclaration`

> Disallow re-declaring a variable with `var` after it has already been declared.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | — |

## Why This Rule Exists

In AMPscript, re-declaring an already-declared variable with `var` silently resets its value to `null`. This is a common source of bugs when code is copy-pasted or blocks are re-ordered — the second `var @x` statement discards any value assigned in between, leading to unexpected empty output or runtime errors downstream.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  var @name
  set @name = "Alice"
  var @name
  /* @name is now null */
  output(concat("Hello ", @name))
]%%
```

**Allowed:**

```ampscript
%%[
  var @name
  set @name = "Alice"
  output(concat("Hello ", @name))
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-var-redeclaration': 'off' }
```
