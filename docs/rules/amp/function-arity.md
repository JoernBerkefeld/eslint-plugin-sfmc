# `sfmc/amp-function-arity`

> Enforce correct argument counts for known AMPscript functions.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

AMPscript functions have fixed required and optional argument counts documented in the Salesforce catalog. Calling a function with too few arguments causes a runtime error. Calling it with too many can silently truncate or fail. This rule validates every call against the known min/max argument counts.

Several AMPscript functions are variadic: their trailing arguments repeat in fixed-size groups (for example `Concat` repeats a single value, while the DataExtension `UpdateData`/`UpsertData` family repeats column/value pairs). For these functions the catalog carries a `repeat` model describing where the repeating block starts, how many arguments form one group, and — for the Update/Upsert family — which earlier argument dictates how many search pairs precede the update pairs. This rule additionally reports `incompleteGroup` when the trailing arguments do not form complete groups.

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

  /* UpdateData: one search pair, then an incomplete update group (odd trailing args) */
  UpdateData("MyDE", 1, "Key", @key, "Col", @v, "Orphan")
]%%
```

**Allowed:**

```ampscript
%%[
  var @val
  set @val = Lookup("MyDE", "Value", "Key", @key)
  set @val = Format(@num, "0.00", "en-US")

  /* UpdateData: one search pair + one update pair (complete groups) */
  UpdateData("MyDE", 1, "Key", @key, "Col", @v)
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-function-arity': 'off' }
```
