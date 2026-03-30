# `sfmc/ssjs-require-hasownproperty`

> Require a `hasOwnProperty` guard in `for…in` loops.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | **Suggestion** (manual, via VS Code lightbulb) |

## Why This Rule Exists

In SFMC's SSJS runtime, objects frequently carry inherited properties such as `_type` that are visible in `for…in` iterations. Without a `hasOwnProperty` guard, these prototype properties are processed alongside the object's own data, leading to unexpected behaviour or errors. This is an amplified version of the general JavaScript best practice that applies specifically to SFMC because Core library objects are particularly prone to having non-enumerable inherited properties exposed.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```js
for (var key in myObject) {
    write(key + ": " + myObject[key]);
}
```

**Allowed:**

```js
for (var key in myObject) {
    if (myObject.hasOwnProperty(key)) {
        write(key + ": " + myObject[key]);
    }
}
```

## Fix

This rule provides a **suggestion** (not applied automatically). To apply it:

- Click the **lightbulb** / press `Ctrl+.` on the flagged code in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- `eslint --fix` does **not** apply suggestions (`--fix-type suggestion` filters fixable rules by rule category, it does **not** apply `hasSuggestions` suggestions)

What the suggestion does: wraps the entire loop body in an `if (obj.hasOwnProperty(key)) { … }` guard. When the body is already a block statement, the existing content is preserved inside the new `if`; when it is a single statement, a new block is created around it.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-require-hasownproperty': 'off' }
```
