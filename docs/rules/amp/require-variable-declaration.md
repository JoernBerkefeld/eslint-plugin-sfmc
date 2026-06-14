# `sfmc/amp-require-variable-declaration`

> Require variables to be declared with `var` before use in `set` statements.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `off` by default |
| **Fixable** | **Auto-fix** (`eslint --fix`) |

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

## Fix

This rule provides an **auto-fix**. Applied by:

- `eslint --fix` on the command line
- **Fix this issue** / **Fix all auto-fixable problems** in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- On save via `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`

What the auto-fix does: inserts `var @variableName` on the line immediately before the first `set` that uses an undeclared `@variable`. Only the first occurrence of each variable receives a fix in a single `--fix` pass to avoid duplicate `var` lines.

## When to Disable

This rule is off by default because undeclared `set` is valid AMPscript. Enable it for teams that want to enforce a strict declaration-first style.

```js
// eslint.config.js
rules: { 'sfmc/amp-require-variable-declaration': 'warn' }
```
