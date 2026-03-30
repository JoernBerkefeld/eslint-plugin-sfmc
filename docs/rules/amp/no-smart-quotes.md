# `sfmc/amp-no-smart-quotes`

> Disallow smart/curly quotes in string literals.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | **Auto-fix** (`eslint --fix`) |

## Why This Rule Exists

AMPscript's parser only recognises straight ASCII single (`'`) and double (`"`) quotes as string delimiters. Smart (curly) quotes — such as `"`, `"`, `'`, `'` — are commonly introduced by word processors, rich-text editors, or copy-pasting from documentation. When these characters appear inside a string literal the AMPscript engine produces a parse error or treats the content as malformed, causing the email or page to fail silently or crash.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  var @name
  set @name = "John"
  set @name = 'Jane'
]%%
```

**Allowed:**

```ampscript
%%[
  var @name
  set @name = "John"
  set @name = 'Jane'
]%%
```

## Fix

This rule provides an **auto-fix**. Applied by:

- `eslint --fix` on the command line (applies ALL fixable rules regardless of `meta.type`; use `--fix-type problem` or `--fix-type suggestion` to filter by rule category)
- **Fix this issue** / **Fix all auto-fixable problems** in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- On save via `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`

What the fix does: replaces every smart quote inside the string content with its ASCII equivalent (`'` for single-flavour curly quotes, `"` for double-flavour). If the replacement would introduce the existing outer delimiter, the outer quotes are switched (e.g. `"…"` becomes `'…'`). If both quote types would appear after replacement, no automatic fix is applied.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-smart-quotes': 'off' }
```
