# `sfmc/hbs-no-unknown-binding`

> Disallow unknown `{!$...}` built-in data bindings in Marketing Cloud Next Handlebars.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in the `-next` configs; `off` in classic configs |
| **Fixable** | — |

## Why This Rule Exists

Marketing Cloud Next exposes a fixed set of built-in data bindings written as `{!$namespace.Field}` tokens (for example `{!$Context.MessageContext}`). These `{!$...}` tokens are **not** Handlebars helper syntax — the Handlebars parser treats them as literal content — so this rule scans the raw source text with a regex pass rather than walking the AST, mirroring the `handlebars/unknown-binding` diagnostic emitted by the language server.

An unrecognized binding name is a typo or a reference to a namespace/field that MCN does not provide, and resolves to empty output at render time. The rule offers a "did you mean" suggestion when a close match exists.

Handlebars only exists when targeting MCN, so this rule is enabled only in the `-next` configs.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` (in `-next` configs) |

This rule has no configuration options.

## Examples

**Not allowed:**

```handlebars
{{! 'Contect' is not a known binding namespace }}
{!$Contect.MessageContext}
```

**Allowed:**

```handlebars
{!$Context.MessageContext}
```

## When to Disable

Disable only if you use a binding that is available in your MCN account but missing from the bundled catalog (please report it so the catalog can be updated).

```js
// eslint.config.js
rules: { 'sfmc/hbs-no-unknown-binding': 'off' }
```
