# `sfmc/ssjs-no-unsupported-syntax`

> Disallow ES6+ syntax features not supported by the SFMC SSJS engine.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | **Auto-fix** for `let`/`const`; **Suggestion** for `??` |

## Why This Rule Exists

SFMC executes Server-Side JavaScript using JINT, a .NET-based engine that implements ECMAScript 3 with some ES5 additions. Modern JavaScript syntax introduced in ES6 and later — including `let`, `const`, template literals, arrow functions, destructuring, classes, `async/await`, optional chaining, and nullish coalescing — is not available and causes runtime errors. Code that works in a browser or Node.js will silently fail or produce cryptic errors in SFMC.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |
| `allow` | Array of feature names to suppress | `[]` |

#### Known feature names for `allow`

`LetDeclaration`, `ConstDeclaration`, `ArrowFunction`, `TemplateLiteral`, `DestructuringAssignment`, `SpreadOperator`, `ClassDeclaration`, `AsyncFunction`, `OptionalChaining`, `NullishCoalescing`, `ForOfStatement`, `GeneratorFunction`, `Symbol`, `Proxy`, `WeakMap`, `WeakSet`, `BigInt`

### Default behavior (no `allow`)

**Not allowed:**

```js
const greeting = `Hello, ${name}`;
let count = 0;
const double = (x) => x * 2;
const value = obj?.prop ?? "default";
```

**Allowed:**

```js
var greeting = "Hello, " + name;
var count = 0;
function double(x) { return x * 2; }
var value = (obj && obj.prop !== null && obj.prop !== undefined) ? obj.prop : "default";
```

### With `allow: ["LetDeclaration", "ConstDeclaration"]`

`let` and `const` are no longer flagged, but all other unsupported syntax is still reported.

## Fix

**Auto-fix** for `let` and `const` declarations. Applied by:

- `eslint --fix` on the command line
- **Fix this issue** / **Fix all auto-fixable problems** in VS Code (requires the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint))
- On save via `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`

What the auto-fix does: replaces the `let` or `const` keyword with `var`, leaving the rest of the declaration unchanged.

---

**Suggestion** for nullish coalescing (`??`). Applied by:

- Click the **lightbulb** / press `Ctrl+.` on the flagged code in VS Code (requires the ESLint extension)
- `eslint --fix` does **not** apply suggestions (`--fix-type suggestion` filters fixable rules by rule category, it does **not** apply `hasSuggestions` suggestions)

What the suggestion does: replaces `??` with `||`. Note that `||` has different semantics — it also treats `0`, `""`, and `false` as falsy, unlike `??` which only replaces `null` and `undefined`.

## Configuration Example

```js
// eslint.config.js
rules: {
  'sfmc/ssjs-no-unsupported-syntax': ['error', { allow: ['LetDeclaration'] }]
}
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-unsupported-syntax': 'off' }
```
