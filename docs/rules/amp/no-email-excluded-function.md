# `sfmc/amp-no-email-excluded-function`

> Disallow AMPscript functions that are not available in the email execution context.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `off` by default |
| **Fixable** | — |

## Why This Rule Exists

Several AMPscript functions — including `InsertData`, `UpdateData`, `DeleteData`, `UpsertData`, `Redirect`, `HTTPGet`, and others — are only available in CloudPage and landing-page contexts. Calling them inside an email causes a runtime error, silently fails, or aborts the send. This rule flags those calls when the file is identified as an email template.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"off"` |
| `context` | `"email"` \| `"cloudpage"` \| `"auto"` | `"email"` |

### Under `"email"` (default)

Flags every call to an email-excluded function regardless of the filename.

**Not allowed:**

```ampscript
%%[
  InsertData("MyDE", "Email", @email)
  Redirect("https://example.com")
]%%
```

**Allowed:**

```ampscript
%%[
  InsertDE("MyDE", "Email", @email)
]%%
```

> Note: `InsertDE` is itself deprecated — see [`amp-no-deprecated-function`](no-deprecated-function.md).

### Under `"cloudpage"`

Disables all checks. Use this setting for files that are exclusively used as CloudPages.

### Under `"auto"`

Skips checking for files whose name or path contains `cloudpage` or `landing`, or whose extension is `.html`. Otherwise behaves like `"email"`.

## Configuration Example

```js
// eslint.config.js
rules: {
  'sfmc/amp-no-email-excluded-function': ['warn', { context: 'auto' }]
}
```

## When to Disable

This rule is off by default because many projects contain both email and CloudPage AMPscript. Enable it with `"context": "auto"` for mixed-use projects, or with `"context": "email"` for email-only repositories.

```js
// eslint.config.js
rules: { 'sfmc/amp-no-email-excluded-function': 'off' }
```
