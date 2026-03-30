# `sfmc/amp-no-nested-ampscript-delimiter`

> Disallow `%%[` or `%%=` delimiters inside an already-open AMPscript region.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | **Auto-fix** (`eslint --fix`) |

## Why This Rule Exists

AMPscript delimiters (`%%[`, `]%%`, `%%=`, `=%%`) are used in HTML context to mark the start and end of AMPscript regions. Inside an already-open region — whether a `%%[...]%%` block, a `%%=...=%%` inline expression, or a `<script language="ampscript">` tag — these delimiters are not needed and indicate a structural mistake.

Two sub-cases:

- `%%[` or `%%=` inside a `<script language="ampscript">` block — redundant because the script tag already establishes AMPscript context for its entire body.
- `%%[` nested inside an already-open `%%[...]%%` block — double-opening without a corresponding close.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

### Examples

**Not allowed — delimiter inside script tag:**

```html
<script runat="server" language="ampscript">
  %%[ set @x = "redundant delimiter" ]%%
</script>
```

**Not allowed — nested block delimiter:**

```ampscript
%%[
  %%[ set @inner = "nested" ]%%
]%%
```

**Allowed:**

```html
<script runat="server" language="ampscript">
  set @x = "no delimiter needed here"
</script>
```

```ampscript
%%[
  set @x = "correct"
]%%
```

## Fix

This rule provides an **auto-fix** that removes the redundant delimiter pair (`%%[`/`]%%` or `%%=`/`=%%`), leaving only the inner code.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-nested-ampscript-delimiter': 'off' }
```
