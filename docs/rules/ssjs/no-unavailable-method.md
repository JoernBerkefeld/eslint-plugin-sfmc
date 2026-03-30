# `sfmc/ssjs-no-unavailable-method`

> Flag Array methods that are unavailable or broken in SFMC SSJS and suggest inserting a polyfill.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended` and `strict` |
| **Fixable** | **Suggestion** only (lightbulb / `Ctrl+.` in VS Code) |

## Why This Rule Exists

SFMC Server-Side JavaScript runs on an old ECMAScript 3/5 engine (Jint). Many modern
`Array` methods that developers expect to work either throw a runtime error or silently
return wrong results:

- **Unavailable** — the method does not exist on the object at all. Calling it throws
  `expecting object: <methodName>` at runtime.
- **Broken** — the method exists natively but its implementation is incorrect:
  - `splice` ignores its first two parameters and replaces elements from the left.
  - `lastIndexOf` always returns `-1`.

This rule detects both categories and offers a lightbulb suggestion to insert a polyfill
at the end of the file.

## Covered methods

| Method | Category | Notes |
|--------|----------|-------|
| `Array.prototype.copyWithin` | unavailable | |
| `Array.prototype.entries` | unavailable | Returns a minimal iterator; `for...of` is also unsupported |
| `Array.prototype.fill` | unavailable | |
| `Array.prototype.filter` | unavailable | |
| `Array.prototype.find` | unavailable | |
| `Array.prototype.findIndex` | unavailable | |
| `Array.prototype.forEach` | unavailable | |
| `Array.prototype.includes` | unavailable | |
| `Array.prototype.indexOf` | unavailable | Only flagged on array literals; string `.indexOf()` still works |
| `Array.prototype.lastIndexOf` | broken | Natively always returns `-1` |
| `Array.prototype.map` | unavailable | |
| `Array.prototype.reduce` | unavailable | |
| `Array.prototype.reduceRight` | unavailable | |
| `Array.prototype.some` | unavailable | |
| `Array.prototype.splice` | broken | Natively ignores `startIndex` and `deleteCount` |
| `Array.isArray` | unavailable | |
| `Array.of` | unavailable | |

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` |
| `ignore` | Array of method names to suppress | `[]` |

Use `ignore` when polyfills are loaded externally via a Content Block or Code Resource
that runs before your script.

```js
// eslint.config.js
rules: {
    'sfmc/ssjs-no-unavailable-method': ['warn', { ignore: ['map', 'filter', 'forEach'] }]
}
```

## Examples

### Not allowed (without polyfill)

```js
var nums = [1, 2, 3];
var doubled = nums.map(function (n) { return n * 2; });   // unavailable

var pos = nums.lastIndexOf(2);   // broken — always returns -1 natively

var found = Array.isArray(nums); // unavailable
```

### Allowed

```js
// Polyfill defined in the same file — rule is suppressed
Array.prototype.map = function (callback) { /* ... */ };

var doubled = nums.map(function (n) { return n * 2; }); // ok

// Native methods that work correctly are never flagged
nums.push(4);
nums.reverse();
nums.join(', ');
nums.slice(0, 2);
```

### With `ignore`

```js
// eslint.config.js
rules: {
    'sfmc/ssjs-no-unavailable-method': ['warn', { ignore: ['map', 'filter'] }]
}
```

```js
// No warning — 'map' and 'filter' are in the ignore list
var doubled = nums.map(function (n) { return n * 2; });
var evens   = nums.filter(function (n) { return n % 2 === 0; });
```

## Suggestion (lightbulb)

When a violation is reported, a suggestion is available to insert the individual
polyfill at the **end of the file**. Apply it via:

- Click the **lightbulb** or press `Ctrl+.` in VS Code (requires the ESLint extension)
- `eslint --fix` does **not** apply suggestions

> **Important:** `Array.prototype.X = function () {}` is an assignment expression —
> it is **not** hoisted like a function declaration. You must ensure the polyfill
> executes before the first call to the method. If you apply the suggestion and the
> method is called earlier in the file, move the polyfill above the first usage, or
> load it from an external Content Block / Code Resource that runs first.

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unavailable-method': 'off' }
```

Or suppress per-line for a single call you know is safe:

```js
// eslint-disable-next-line sfmc/ssjs-no-unavailable-method
var result = myArr.map(transform);
```
