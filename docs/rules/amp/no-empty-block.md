# `sfmc/amp-no-empty-block`

> Disallow empty AMPscript blocks that produce no output or side effects.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | **Suggestion** (manual, via VS Code lightbulb) |

## Why This Rule Exists

An empty `%%[ ]%%` block (one that contains no statements other than comments) does nothing. Such blocks are typically leftovers from deleted code or copy-paste errors. While harmless at runtime, they add noise to templates and can cause confusion during maintenance.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
]%%

%%[
  /* TODO: add logic here */
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

This rule provides a **suggestion** (not applied automatically). To apply it:

- Click the **lightbulb** / press `Ctrl+.` on the flagged code in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- `eslint --fix` does **not** apply suggestions (`--fix-type suggestion` filters fixable rules by rule category, it does **not** apply `hasSuggestions` suggestions)

What the suggestion does: removes the entire `%%[ ]%%` block from the source.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-empty-block': 'off' }
```
