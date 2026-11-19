# `sfmc/hbs-helper-arity`

> Enforce correct positional-argument counts for known Marketing Cloud Next Handlebars helpers.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in the `-next` configs; `off` in classic configs |
| **Fixable** | — |

## Why This Rule Exists

Each Marketing Cloud Next helper has a fixed set of positional parameters defined in the catalog. Calling a helper with too few required arguments, or with more arguments than it accepts, fails at render time. This rule validates every helper invocation against the helper's `params` definition.

Only **positional** arguments are checked. Helpers with a variadic trailing parameter (for example `concat`, `and`, `set`) have no upper bound. Hash (named) arguments such as `charset="UTF-16"` are not counted as positional arguments, and helpers that accept named arguments (for example `md5`, `regExMatch`, `query`, `claimRow`) likewise have no upper bound. A bare `{{foo}}` mustache with no arguments is a data binding, not an invocation, and is skipped.

Handlebars only exists when targeting MCN, so this rule is enabled only in the `-next` configs.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` (in `-next` configs) |

This rule has no configuration options.

## Examples

**Not allowed:**

```handlebars
{{! formatDate requires a value and a format string }}
{{formatDate order.createdAt}}

{{! uppercase takes exactly one argument }}
{{uppercase firstName lastName}}
```

**Allowed:**

```handlebars
{{formatDate order.createdAt "yyyy-MM-dd"}}

{{uppercase firstName}}

{{! concat is variadic — any number of arguments is fine }}
{{concat firstName " " lastName}}

{{! named arguments are not counted: md5 takes one positional argument }}
{{md5 emailAddress charset="UTF-16"}}

{{! query takes named arguments only }}
{{#each (query object="Account" type="CRM")}}{{this.Name}}{{/each}}
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/hbs-helper-arity': 'off' }
```
