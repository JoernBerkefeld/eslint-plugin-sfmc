# `sfmc/amp-no-html-comment`

> Disallow HTML comment syntax (`<!-- ... -->`) inside AMPscript regions.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended`, `error` in `strict` |
| **Fixable** | **Auto-fix** (`eslint --fix`) |

## Why This Rule Exists

AMPscript has no HTML comment syntax. HTML comments (`<!-- -->`) inside AMPscript blocks are silently ignored by the SFMC compiler, but they break language servers, formatters (Prettier), and ESLint — including causing crashes in ESLint's `spaced-comment` rule.

Two common variants are caught:

- `<!--/* comment */-->` — an AMPscript `/* */` block comment unnecessarily wrapped in HTML comment markers.
- `<!-- comment -->` — a plain HTML comment used where an AMPscript comment should be.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  <!--/* OPCO specific Language */-->
  set @Opco = AttributeValue("OwningEntity__c")
]%%
```

```ampscript
%%[
  <!-- some section header -->
  set @x = 1
]%%
```

**Allowed:**

```ampscript
%%[
  /* OPCO specific Language */
  set @Opco = AttributeValue("OwningEntity__c")
]%%
```

## Fix

This rule provides an **auto-fix**:

- `<!--/* ... */-->` → `/* ... */` (HTML wrapper is stripped, inner block comment is kept as-is)
- `<!-- ... -->` → `/* ... */` (entire construct is replaced with an AMPscript block comment)

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-html-comment': 'off' }
```
