# `sfmc/ssjs-cache-loop-length`

> Require caching array `.length` in `for` loop conditions.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | **Suggestion** (manual, via VS Code lightbulb) |

## Why This Rule Exists

SFMC's SSJS engine (JINT) re-evaluates the loop test expression on every iteration. A condition like `i < arr.length` therefore calls the `.length` getter on every pass through the loop. For large arrays this is a measurable performance cost. The recommended pattern (per Mateusz Dąbrowski's SSJS style guide) is to cache the length in a variable in the loop initialiser:

```js
for (var i = 0, _len = arr.length; i < _len; i++) { … }
```

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
for (var i = 0; i < items.length; i++) {
    process(items[i]);
}
```

**Allowed:**

```js
for (var i = 0, _len = items.length; i < _len; i++) {
    process(items[i]);
}
```

## Fix

This rule provides a **suggestion** (not applied automatically). To apply it:

- Click the **lightbulb** / press `Ctrl+.` on the flagged code in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- `eslint --fix` does **not** apply suggestions (`--fix-type suggestion` filters fixable rules by rule category, it does **not** apply `hasSuggestions` suggestions)

What the suggestion does: appends `, _len = arr.length` to the last declarator in the `for` loop initialiser and replaces `arr.length` in the test condition with `_len`. The suggestion is only offered when the loop `init` is a `var` declaration (the typical case).

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-cache-loop-length': 'off' }
```
