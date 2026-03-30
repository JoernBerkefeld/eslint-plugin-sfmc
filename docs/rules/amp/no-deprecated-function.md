# `sfmc/amp-no-deprecated-function`

> Flag deprecated AMPscript functions and suggest their modern replacements.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | **Auto-fix** for 1:1 replacements; **Suggestion** for ambiguous replacements |

## Why This Rule Exists

Salesforce has deprecated several AMPscript functions in favour of newer equivalents. The old functions (e.g. `InsertDE`, `UpdateDE`, `DeleteDE`, `LookupValue`) remain functional for backward compatibility but may be removed in a future platform update. `ContentArea` is a Classic-only function with no equivalent in Content Builder — callers must choose between `ContentBlockByKey` or `ContentBlockByName` depending on their setup.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```ampscript
%%[
  var @rows
  set @rows = LookupValue("MyDE", "Email", "SubKey", @key)

  var @html
  set @html = ContentArea(42)
]%%
```

**Allowed:**

```ampscript
%%[
  var @rows
  set @rows = Lookup("MyDE", "Email", "SubKey", @key)

  /* Choose one depending on your setup: */
  var @html
  set @html = ContentBlockByKey("my-block-key")
  /* or */
  set @html = ContentBlockByName("My Block Name")
]%%
```

## Fix

This rule provides two types of fix depending on the deprecated function:

**Auto-fix** (for 1:1 replacements such as `InsertDE → InsertData`, `LookupValue → Lookup`, etc.). Applied by:

- `eslint --fix` on the command line (because `meta.type` is `"suggestion"`, you can also target it specifically with `--fix-type suggestion`)
- **Fix this issue** / **Fix all auto-fixable problems** in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- On save via `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`

What the auto-fix does: replaces only the function name token, leaving all arguments intact.

---

**Suggestion** (for `ContentArea`, which maps to either `ContentBlockByKey` or `ContentBlockByName`). Applied by:

- Click the **lightbulb** / press `Ctrl+.` on the flagged code in VS Code (requires the ESLint extension)
- `eslint --fix` does **not** apply suggestions (`--fix-type suggestion` filters fixable rules by rule category, it does **not** apply `hasSuggestions` suggestions)

What the suggestion does: offers two separate options — replace `ContentArea` with `ContentBlockByKey` or with `ContentBlockByName`.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-deprecated-function': 'off' }
```
