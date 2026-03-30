# `sfmc/amp-no-js-line-comment`

> Disallow JavaScript-style single-line comments (`// ...`) inside AMPscript regions.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended`, `error` in `strict` |
| **Fixable** | **Auto-fix** (`eslint --fix`) |

## Why This Rule Exists

AMPscript only supports block comments (`/* ... */`). JavaScript-style single-line comments (`// comment`) are silently ignored by the SFMC compiler, but they cause crashes in ESLint (the `spaced-comment` rule throws an unhandled error), break Prettier formatting, and can confuse the language server.

Note: `://` in URLs (e.g. `"https://example.com"`) inside string literals is not flagged because string contents are not parsed as code.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  // ---------------Language---------------
  set @Opco = AttributeValue("OwningEntity__c")
]%%
```

**Allowed:**

```ampscript
%%[
  /* ---------------Language--------------- */
  set @Opco = AttributeValue("OwningEntity__c")
]%%
```

## Fix

This rule provides an **auto-fix**: `// comment text` is replaced with `/* comment text */`.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-js-line-comment': 'off' }
```
