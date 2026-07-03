# `sfmc/hbs-no-unknown-helper`

> Disallow Handlebars helper invocations that are not part of the Marketing Cloud Next catalog.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in the `-next` configs; `off` in classic configs |
| **Fixable** | — |

## Why This Rule Exists

Marketing Cloud Next (MCN) runs a locked-down Handlebars engine that cannot register custom helpers. Every helper name must exist in the published MCN catalog. An unknown helper name is a typo or an unsupported construct that fails at render time. This rule flags any helper invocation whose name is not in the catalog and offers a "did you mean" suggestion when a close match exists.

A bare `{{foo}}` mustache with no arguments is treated as a **data binding**, not a helper invocation, and is not flagged by this rule. Helper detection applies to inline mustaches with arguments, subexpressions, and block helpers.

Handlebars only exists when targeting MCN, so this rule is enabled only in the `-next` configs. In classic (Marketing Cloud Engagement) configs it is disabled because `{{...}}` is plain content there.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` (in `-next` configs) |

This rule has no configuration options.

## Examples

**Not allowed:**

```handlebars
{{! 'formatDates' is not a catalog helper — did you mean 'formatDate'? }}
{{formatDates order.createdAt "yyyy-MM-dd"}}

{{#eachItem items}}
  {{this.name}}
{{/eachItem}}
```

**Allowed:**

```handlebars
{{formatDate order.createdAt "yyyy-MM-dd"}}

{{#each items}}
  {{this.name}}
{{/each}}

{{! bare binding, not a helper — never flagged }}
{{firstName}}
```

## When to Disable

Disable only if you rely on a helper that is genuinely available in your MCN account but missing from the bundled catalog (please report it so the catalog can be updated).

```js
// eslint.config.js
rules: { 'sfmc/hbs-no-unknown-helper': 'off' }
```
