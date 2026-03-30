# `sfmc/amp-no-empty-then`

> Disallow `IF` statements with an empty `THEN` branch.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | — |

## Why This Rule Exists

An `IF condition THEN … ELSE … ENDIF` where the `THEN` branch is empty is almost always a logic error. The most common cause is an inverted condition — the developer wrote the consequent code in the `ELSE` branch and left `THEN` empty, or accidentally deleted the `THEN` body during editing. The code either does nothing when the condition is true, or produces the wrong output.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  if @isActive == 1 then
  else
    set @msg = "Inactive"
  endif
]%%
```

**Allowed:**

```ampscript
%%[
  if @isActive == 1 then
    set @msg = "Active"
  else
    set @msg = "Inactive"
  endif
]%%
```

```ampscript
%%[
  /* Empty THEN with no ELSE is still flagged — use a positive condition instead */
  if @isActive != 1 then
    set @msg = "Inactive"
  endif
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-empty-then': 'off' }
```
