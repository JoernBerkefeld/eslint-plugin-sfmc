# `sfmc/amp-prefer-attribute-value`

> Prefer `AttributeValue()` over bare personalization strings for safe attribute access.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `off` by default |
| **Fixable** | **Suggestion** (manual, via VS Code lightbulb) |

## Why This Rule Exists

Using a bare identifier such as `FirstName` in a `SET` expression or as a standalone output relies on AMPscript's implicit personalization-string lookup. If the subscriber profile does not contain that attribute the send is aborted with an error. Wrapping the reference in `AttributeValue("FirstName")` instead returns an empty string (or a default value if the second argument is provided) when the attribute is missing, preventing send failures.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"off"` |

This rule has no configuration options.

### Examples

**Not allowed (when rule is enabled):**

```ampscript
%%[
  var @greeting
  set @greeting = concat("Hello, ", FirstName)
]%%
%%=FirstName=%%
```

**Allowed:**

```ampscript
%%[
  var @greeting
  set @greeting = concat("Hello, ", AttributeValue("FirstName"))
]%%
%%=AttributeValue("FirstName")=%%

/* With a default value: */
%%=AttributeValue("FirstName", "default", "", "Subscriber")=%%
```

## Fix

This rule provides a **suggestion** (not applied automatically). To apply it:

- Click the **lightbulb** / press `Ctrl+.` on the flagged code in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- `eslint --fix` does **not** apply suggestions (`--fix-type suggestion` filters fixable rules by rule category, it does **not** apply `hasSuggestions` suggestions)

What the suggestion does: wraps the bare identifier (e.g. `FirstName`) in `AttributeValue("FirstName")`.

## When to Disable

This rule is off by default because bare personalization strings are valid AMPscript. Enable it only if your team wants to enforce the safer `AttributeValue()` pattern across all content.

```js
// eslint.config.js
rules: { 'sfmc/amp-prefer-attribute-value': 'warn' }
```
