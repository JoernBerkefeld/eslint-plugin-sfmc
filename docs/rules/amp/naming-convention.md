# `sfmc/amp-naming-convention`

> Enforce a consistent naming convention for `@variable` names.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `off` by default; `warn` when explicitly enabled |
| **Fixable** | — |

## Why This Rule Exists

AMPscript variable names are case-insensitive at runtime, but inconsistent casing (`@myVar` vs `@MyVar` vs `@MYVAR` for the same variable) causes confusion during code reviews and maintenance. Enforcing a single convention across a codebase makes intent clearer and reduces the risk of typos that create an unintended second variable reference.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"off"` |
| `format` | `"camelCase"` \| `"PascalCase"` | `"camelCase"` |

### Under `"camelCase"` (default)

**Not allowed:**

```ampscript
%%[
  var @FirstName
  var @LAST_NAME
]%%
```

**Allowed:**

```ampscript
%%[
  var @firstName
  var @lastName
]%%
```

### Under `"PascalCase"`

**Not allowed:**

```ampscript
%%[
  var @firstName
  var @last_name
]%%
```

**Allowed:**

```ampscript
%%[
  var @FirstName
  var @LastName
]%%
```

## Configuration Example

```js
// eslint.config.js
rules: {
  'sfmc/amp-naming-convention': ['warn', { format: 'PascalCase' }]
}
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-naming-convention': 'off' }
```
