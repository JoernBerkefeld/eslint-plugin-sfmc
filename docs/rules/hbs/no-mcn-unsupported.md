# `sfmc/hbs-no-mcn-unsupported`

> Disallow Handlebars helpers and bindings not available in the targeted Marketing Cloud Next API version.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in all `-next` configs; `off` otherwise |
| **Fixable** | — |

## Why This Rule Exists

Marketing Cloud Next (MCN) adds new Handlebars helpers and `{!$...}` data bindings across its releases. This rule flags helpers and bindings that will not work in the MCN release you target:

- Helpers/bindings that **Marketing Cloud Next never supported**.
- Helpers/bindings that were **added in a later MCN release** than the one you target (see the `apiVersion` option below).

Unknown helpers and bindings — ones that are not part of Marketing Cloud Next at all — are handled separately by [`sfmc/hbs-no-unknown-helper`](no-unknown-helper.md) and [`sfmc/hbs-no-unknown-binding`](no-unknown-binding.md); this rule only checks the release availability of helpers and bindings that MCN does provide. Handlebars constructs that MCN never supports (partials, decorators, `{{log}}`, etc.) are handled by [`sfmc/hbs-no-unsupported-construct`](no-unsupported-construct.md).

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` in `-next` configs |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiVersion` | `number` | — | The targeted Marketing Cloud Next API version (e.g. `65` = Winter '26, `67` = Summer '26). |

**What `apiVersion` does** (shared with the AMPscript and SSJS MCN rules):

- **Leave it unset** to check against _any_ MCN release: a helper or binding is flagged only if it is never supported in Marketing Cloud Next. Anything that works in some MCN release is allowed.
- **Set it to your target release** (for example `65`) to also flag helpers and bindings that were added in a _later_ MCN release than the one you run. An item is allowed only when it is available in your target release or an earlier one.

Every Handlebars helper and binding is available in some MCN release, so with no `apiVersion` set nothing is flagged. Setting `apiVersion` to an earlier release flags the helpers and bindings added after it — for example, `apiVersion: 65` flags the helpers introduced in release 67.

## Examples

```js
// eslint.config.js
rules: {
  'sfmc/hbs-no-mcn-unsupported': ['error', { apiVersion: 65 }]
}
```

**Not allowed (with `apiVersion: 65`):**

```handlebars
{{! dateAdd was added in a later MCN release than the one targeted (65) }}
{{dateAdd order.createdAt 7 "days"}}
```

**Allowed (with `apiVersion: 65`):**

```handlebars
{{! add is available in this MCN release }}
{{add price tax}}
```

## When to Disable

Disable this rule when you are not targeting Marketing Cloud Next (the default `engagement` configs already leave it `off`).

```js
// eslint.config.js
rules: { 'sfmc/hbs-no-mcn-unsupported': 'off' }
```
