# `sfmc/amp-no-unknown-function`

> Disallow calls to function names not in the known AMPscript catalog.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended`, `strict`, and all `-next` configs |
| **Fixable** | — |

## Why This Rule Exists

AMPscript does not support user-defined functions. Every function call must match a name in Salesforce's published catalog. Calling an unknown name causes a runtime error (or is silently ignored depending on the execution context), making the code unreliable. This rule catches typos and invented names before deployment.

This rule only reports **unknown** function names. Functions that exist in the catalog but are unavailable when targeting Marketing Cloud Next are handled by [`sfmc/amp-no-mcn-unsupported`](no-mcn-unsupported.md).

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule takes no options.

## Examples

**Not allowed:**

```ampscript
%%[
  var @result
  set @result = CustomLookup("MyDE", "Key", @key)
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

Only disable this rule if you are intentionally using a proprietary or undocumented SFMC extension that is not in the public catalog.

```js
// eslint.config.js
rules: { 'sfmc/amp-no-unknown-function': 'off' }
```
