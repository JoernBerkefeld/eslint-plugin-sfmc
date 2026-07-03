# `sfmc/hbs-helper-too-new-for-target`

> Disallow Handlebars helpers newer than the targeted Marketing Cloud Next API version.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `off` (opt-in — requires the `apiVersion` option) |
| **Fixable** | — |

## Why This Rule Exists

Marketing Cloud Next ships new Handlebars helpers over time. Each helper in the catalog records the API version that introduced it (`mcnSince`). If your account targets an older API version, a newer helper is not yet available and fails at render time.

This rule flags any known helper whose introducing version (`mcnSince`) is greater than the API version you target. For example, `dateAdd` first shipped in MCN API version 67 (Summer '26); using it while targeting API version 65 (Winter '26) is reported.

The rule does nothing until you tell it which API version you target via the `apiVersion` option, which is why it defaults to `off` even in the `-next` configs. Set the option to opt in.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"off"` |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiVersion` | `number` | — | The targeted Marketing Cloud Next API version (e.g. `65` = Winter '26, `67` = Summer '26). Helpers introduced after this version are flagged. When omitted, no helper is flagged. |

## Examples

Configure the rule with the API version you target:

```js
// eslint.config.js
rules: {
  'sfmc/hbs-helper-too-new-for-target': ['error', { apiVersion: 65 }]
}
```

**Not allowed (with `apiVersion: 65`):**

```handlebars
{{! dateAdd was introduced in API version 67 }}
{{dateAdd order.createdAt 7 "days"}}
```

**Allowed (with `apiVersion: 65`):**

```handlebars
{{formatDate order.createdAt "yyyy-MM-dd"}}
```

## When to Disable

Leave this rule `off` (its default) if you always target the latest MCN API version, or if you do not need to guard against version drift.

```js
// eslint.config.js
rules: { 'sfmc/hbs-helper-too-new-for-target': 'off' }
```
