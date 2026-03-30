# `sfmc/amp-require-rowcount-check`

> Require a `RowCount > 0` check before iterating over a `LookupRows` result.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | — |

## Why This Rule Exists

When `LookupRows` (or `LookupOrderedRows`) returns an empty rowset and you immediately use `FOR @i = 1 TO RowCount(@rows)`, AMPscript evaluates `RowCount(@rows)` as `0`. A `FOR` loop iterating `1 TO 0` triggers a runtime error on some SFMC versions because the loop body attempts to access row index `1` from an empty set. The safe pattern is to guard the loop with `IF RowCount(@rows) > 0 THEN … ENDIF`.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  var @rows
  set @rows = LookupRows("MyDE", "Status", "Active")

  for @i = 1 to RowCount(@rows) do
    var @email
    set @email = Field(Row(@rows, @i), "Email")
    output(v(@email))
  next @i
]%%
```

**Allowed:**

```ampscript
%%[
  var @rows
  set @rows = LookupRows("MyDE", "Status", "Active")

  if RowCount(@rows) > 0 then
    for @i = 1 to RowCount(@rows) do
      var @email
      set @email = Field(Row(@rows, @i), "Email")
      output(v(@email))
    next @i
  endif
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-require-rowcount-check': 'off' }
```
