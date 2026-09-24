# `sfmc/amp-prefer-boolean-literal`

> Recommend bare boolean literals for AMPscript parameters that also accept numeric or quoted alternatives.

| | |
|---|---|
| **Type** | `suggestion` |
| **Default severity** | `warn` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

Some catalogued AMPscript parameters accept bare booleans as well as equivalent numeric and quoted forms. All of those forms are valid, so `sfmc/amp-arg-types` accepts them. This separate style rule recommends the clearer bare `true` or `false` form without describing the alternatives as invalid syntax.

The rule derives its scope from `ampscript-data` metadata. It only checks parameters whose enum contains both bare booleans and alternative string or numeric representations. String matching remains case-insensitive.

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
