# `sfmc/amp-prefer-boolean-literal`

> Recommend bare boolean literals for AMPscript parameters that also accept numeric or quoted alternatives.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended` and `strict` |
| **Fixable** | Yes — `eslint --fix` or editor quick fix |

## Why This Rule Exists

All catalogued boolean-like AMPscript parameters accept the same eight values: bare `true` and `false`; numeric `1` and `0`; and quoted `'true'`, `'false'`, `'1'`, and `'0'` (with either quote style and case-insensitive word matching). All eight are valid, so `sfmc/amp-arg-types` accepts them. This separate style rule recommends the clearer bare `true` or `false` form without describing the alternatives as invalid syntax.

The rule derives its scope from `ampscript-data` metadata and checks every catalogued boolean-like parameter. Each discouraged static alternative is safely auto-fixed by replacing only that argument with bare `true` or `false`; surrounding code and formatting remain unchanged. Apply fixes with `eslint --fix` or an editor's ESLint quick fix.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |

This rule has no configuration options.

### Recommended

```ampscript
%%[
RaiseError('stop', false, '', 0, true)
RaiseError('stop', false, '', 0, false)
]%%
```

### Produces a recommendation warning

```ampscript
%%[
RaiseError('stop', false, '', 0, 1)
RaiseError('stop', false, '', 0, 'FALSE')
]%%
```

Invalid values such as `2` or `'yes'` are not reported by this rule. They remain errors from `sfmc/amp-arg-types`.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/amp-prefer-boolean-literal': 'off' }
```
