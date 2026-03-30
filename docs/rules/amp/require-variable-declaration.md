# `sfmc/amp-require-variable-declaration`

> Require variables to be declared with `var` before use in `set` statements.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `off` by default |
| **Fixable** | — |

## Why This Rule Exists

AMPscript does not technically require `var` before `set` — you can write `set @x = 1` without a prior declaration. However, the [ampscript.guide](https://ampscript.guide) best-practices documentation recommends always declaring variables with `var` first. This makes code self-documenting, helps catch variable-name typos at lint time, and mirrors the conventions used in official Salesforce examples.

System variables (those starting with `@@`) are not affected.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"off"` |

This rule has no configuration options.

### Examples

**Not allowed (when rule is enabled):**

```ampscript
%%[
  set @name = "Alice"
]%%
```

**Allowed:**

```ampscript
%%[
  var @name
  set @name = "Alice"
]%%
```

## When to Disable

This rule is off by default because undeclared `set` is valid AMPscript. Enable it for teams that want to enforce a strict declaration-first style.

```js
// eslint.config.js
rules: { 'sfmc/amp-require-variable-declaration': 'warn' }
```
