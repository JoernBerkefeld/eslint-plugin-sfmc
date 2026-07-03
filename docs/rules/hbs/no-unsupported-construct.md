# `sfmc/hbs-no-unsupported-construct`

> Disallow Handlebars constructs unsupported by the Marketing Cloud Next engine (partials, decorators, log).

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in the `-next` configs; `off` in classic configs |
| **Fixable** | — |

## Why This Rule Exists

The Marketing Cloud Next Handlebars engine is a locked-down subset of handlebars.js. Several standard handlebars.js constructs are not available and fail at render time:

- Partials — `{{> partialName}}`
- Partial blocks — `{{#> partialName}}...{{/partialName}}`
- Inline partials — `{{#*inline "name"}}...{{/inline}}`
- Decorators — `{{* decorator}}` and `{{#* decorator}}...{{/*decorator}}`
- The debugging helper `{{log}}`

This rule flags each of these, mirroring the `handlebars/unsupported-construct` diagnostic emitted by the language server. The full explanation for the specific construct is included in the reported message.

Handlebars only exists when targeting MCN, so this rule is enabled only in the `-next` configs.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` (in `-next` configs) |

This rule has no configuration options.

## Examples

**Not allowed:**

```handlebars
{{> header}}

{{#> layout}}
  body
{{/layout}}

{{log "debugging"}}
```

**Allowed:**

```handlebars
{{! inline the shared markup instead of using a partial }}
<h1>{{title}}</h1>

{{#each items}}
  {{this.name}}
{{/each}}
```

## When to Disable

These constructs do not run in MCN, so disabling the rule only hides a guaranteed render-time failure. Leave it enabled.

```js
// eslint.config.js
rules: { 'sfmc/hbs-no-unsupported-construct': 'off' }
```
