# `sfmc/amp-no-nonfunctional-function`

> Flag AMPscript functions that resolve at runtime but have no known working invocation.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | No — there is no replacement to auto-apply |

## Why This Rule Exists

A handful of catalogued AMPscript functions still parse and resolve, yet every reached call aborts the page at runtime. This happens when the platform capability the function depends on has been retired (for example Classic Portfolio behind `GetPortfolioItem`, or Classic Content behind `GetPublishedSocialContent`), or when the integration it targets has no working call shape (the MSCRM family).

These functions are deliberately kept in completions and hover — they exist in the language — but calling one is always a bug, so the call site is flagged. This is distinct from deprecation: Salesforce never issued a formal sunset notice or a drop-in replacement, so `amp-no-deprecated-function` does not cover them.

In Marketing Cloud Next targets these same functions are already reported by `amp-no-mcn-unsupported`, so this rule is disabled in the `-next` configs to avoid a duplicate diagnostic.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  var @item
  set @item = GetPortfolioItem("my-portfolio-key")

  var @social
  set @social = GetPublishedSocialContent("socialContentId")
]%%
```

**Allowed:**

```ampscript
%%[
  var @block
  set @block = ContentBlockByKey("my-block-key")
]%%
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-nonfunctional-function': 'off' }
```
