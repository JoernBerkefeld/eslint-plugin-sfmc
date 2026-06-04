# `sfmc/amp-no-unknown-function`

> Disallow calls to function names not in the known AMPscript catalog.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended`, `strict`, and all `-next` configs |
| **Fixable** | — |

## Why This Rule Exists

AMPscript does not support user-defined functions. Every function call must match a name in Salesforce's published catalog. Calling an unknown name causes a runtime error (or is silently ignored depending on the execution context), making the code unreliable. This rule catches typos and invented names before deployment.

When targeting **Marketing Cloud Next**, only a subset of AMPscript functions are supported. Use the `target: 'next'` option to flag functions that cannot run in MCN.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `'engagement'` \| `'next'` | — | Target platform. Set to `'next'` to additionally flag AMPscript functions not available in Marketing Cloud Next (API v67.0+). |

## Examples

### Standard usage (Marketing Cloud Engagement)

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

### MCN target

Configure the rule with `target: 'next'` to flag functions unsupported in Marketing Cloud Next:

```js
// eslint.config.js
rules: {
  'sfmc/amp-no-unknown-function': ['error', { target: 'next' }]
}
```

Or use the built-in `recommended-next` / `strict-next` / `embedded-next` configs which apply this automatically.

**Not allowed (with `target: 'next'`):**

```ampscript
%%[
  /* InsertDE is not supported in Marketing Cloud Next */
  InsertDE("MyDE", "Col", "Value")
]%%
```

**Allowed (with `target: 'next'`):**

```ampscript
%%[
  /* UpsertDE is supported in Marketing Cloud Next */
  UpsertDE("MyDE", 1, "Key", @key, "Col", "Value")
]%%
```

## When to Disable

Only disable this rule if you are intentionally using a proprietary or undocumented SFMC extension that is not in the public catalog.

```js
// eslint.config.js
rules: { 'sfmc/amp-no-unknown-function': 'off' }
```
