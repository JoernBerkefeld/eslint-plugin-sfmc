# `sfmc/amp-no-ambiguous-personalization-delimiter`

> Disallow a personalization string directly followed by `[` or `=`, which may or may not form an AMPscript delimiter.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended` and `strict` |
| **Fixable** | No |

## Why This Rule Exists

Marketing Cloud replaces a personalization string such as `%%emailaddr%%` before it parses AMPscript — but only when the name resolves. When the closing `%%` is directly followed by `[` or `=`, the outcome therefore depends on the name:

- **The name resolves** — the string is replaced by its value first. The `%%[` or `%%=` that seemed to follow never exists, so no AMPscript starts and everything after the value is output as written. `%%memberid%%=v(@a)=%%` renders as the member ID followed by the literal text `=v(@a)=%%`.
- **The name does not resolve** — the string is left alone and its closing `%%` joins the next character to form a real `%%[` or `%%=`. `50%%off%%[ set @x = 1 ]%%` runs the block.

A linter cannot know whether a name resolves: profile attributes and sendable data extension fields differ per account and per send, and most of them are not available on a CloudPage. The same line can therefore behave differently depending on where it runs. Separating the personalization string from the following character removes the doubt.

The rule reports two cases with different messages:

- **System personalization strings** (`%%emailaddr%%`, `%%memberid%%`, …) always resolve, so the text after them is never AMPscript.
- **Any other name** — the result depends on the context the content runs in.

Only the character directly after the closing `%%` matters. The opposite side (`=%%emailaddr%%`, as in a URL parameter) is the normal way to use a personalization string and is not reported. Strings inside AMPscript blocks, inline expressions and server-side JavaScript are not checked.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Examples

**Not allowed — system personalization string followed by `=`:**

```html
<a href="https://example.com/?e=%%emailaddr%%=1">Open</a>
```

```html
%%emailaddr%%=v(@a)=%%
```

**Not allowed — other name followed by `[` or `=`:**

```html
<td>%%First Name%%[x]</td>
```

```html
50%%off%%[ set @x = 1 ]%%
```

**Allowed:**

```html
<a href="https://example.com/?e=%%emailaddr%%&a=1">Open</a>
<p>%%emailaddr%% = 1</p>
<td>%%First Name%% [x]</td>
<p>%%=v(@a)=%%%%=v(@b)=%%</p>
```

## Fix

This rule has no auto-fix: inserting a character changes the rendered output, and only the author knows whether literal text or AMPscript was intended.

- If the following text is meant literally, put a space or another character between the personalization string and the `[` or `=`.
- If AMPscript was intended, move the block or inline expression away from the personalization string.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-no-ambiguous-personalization-delimiter': 'off' }
```
