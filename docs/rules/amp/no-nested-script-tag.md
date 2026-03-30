# `sfmc/amp-no-nested-script-tag`

> Disallow nested `<script language="ampscript">` tags inside an already-open AMPscript script block.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | **Auto-fix** (`eslint --fix`) |

## Why This Rule Exists

Each `<script runat="server" language="ampscript">` block must be closed with `</script>` before a new one can be opened. A nested opening tag is structurally invalid and almost always indicates a missing `</script>` closing tag. The SFMC compiler may silently ignore the nested tag, leading to code that appears to work but is structured incorrectly.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed:**

```html
<script runat="server" language="ampscript">
  set @a = "outer"

<script runat="server" language="ampscript">
  set @b = "inner - this tag is nested!"
</script>
</script>
```

**Allowed:**

```html
<script runat="server" language="ampscript">
  set @a = "outer"
</script>

<script runat="server" language="ampscript">
  set @b = "second block - valid"
</script>
```

## Fix

This rule provides an **auto-fix**: inserts `</script>` immediately before the nested opening tag, converting the nested block into a valid sequential block.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-nested-script-tag': 'off' }
```
