# `sfmc/amp-no-mcn-unsupported`

> Disallow AMPscript functions that are not available in the targeted Marketing Cloud Next API version.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in all `-next` configs; `off` otherwise |
| **Fixable** | — |

## Why This Rule Exists

Only a subset of AMPscript functions are available in Marketing Cloud Next (MCN), and support has been added gradually across MCN releases. This rule flags AMPscript functions that will not work in the MCN release you target:

- Functions that **Marketing Cloud Next never supported** — they only work in classic Marketing Cloud Engagement.
- Functions that were **added in a later MCN release** than the one you target (see the `apiVersion` option below).
- Functions that work in MCN AMPscript but have **no Handlebars equivalent**, so they cannot be carried over if you later migrate the content to Handlebars.

Unknown function names are handled separately by [`sfmc/amp-no-unknown-function`](no-unknown-function.md); this rule only checks functions that actually exist in AMPscript.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` in `-next` configs |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiVersion` | `number` | — | The targeted Marketing Cloud Next API version (e.g. `65` = Winter '26, `67` = Summer '26). |

**What `apiVersion` does** (shared with the SSJS and Handlebars MCN rules):

- **Leave it unset** to check against _any_ MCN release: a function is flagged only if it is never supported in Marketing Cloud Next. Anything that works in some MCN release is allowed.
- **Set it to your target release** (for example `65`) to also flag functions that were added in a _later_ MCN release than the one you run. A function is allowed only when it is available in your target release or an earlier one.

## Examples

```js
// eslint.config.js
rules: {
  'sfmc/amp-no-mcn-unsupported': ['error', { apiVersion: 65 }]
}
```

Or use the built-in `recommended-next` / `strict-next` / `embedded-next` configs, which apply this rule automatically (without an `apiVersion`, flagging only never-supported functions).

**Not allowed (with `apiVersion: 65`):**

```ampscript
%%[
  /* InsertDE is never available in Marketing Cloud Next */
  InsertDE("MyDE", "Col", "Value")
  /* Concat was added in a later MCN release than the one targeted (65) */
  set @x = Concat("a", "b")
]%%
```

**Allowed (with `apiVersion: 67`):**

```ampscript
%%[
  /* Concat is available in this MCN release */
  set @x = Concat("a", "b")
]%%
```

## When to Disable

Disable this rule when you are not targeting Marketing Cloud Next (the default `engagement` configs already leave it `off`).

```js
// eslint.config.js
rules: { 'sfmc/amp-no-mcn-unsupported': 'off' }
```
