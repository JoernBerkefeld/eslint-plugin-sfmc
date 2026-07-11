# `eslint-plugin-unicorn` compatibility with SFMC SSJS

> **Compatibility analysis for [`eslint-plugin-unicorn@71.1.0`](https://github.com/sindresorhus/eslint-plugin-unicorn).**
>
> ⚠️ **Version warning:** This classification was done against `eslint-plugin-unicorn` **v71.1.0** (300 recommended rules). Newer versions of unicorn may add, rename, or change rules that are **not** yet classified here. Re-audit this page whenever you upgrade unicorn — a rule added in a later version could autofix SSJS into runtime-breaking code without being in the override list below.

`eslint-plugin-unicorn` is an excellent, actively maintained plugin that we **strongly recommend** — but it targets modern JavaScript engines, not the Salesforce Marketing Cloud **SSJS** runtime. SFMC SSJS runs on a JINT-based ES3/ES5-era engine that is missing many built-ins (`Array#includes`, `String#startsWith`, `Set`, `Map`, `Object.fromEntries`, `Math.trunc`, spread `...`, ES modules, `async`/`await`, …). See the SFMC evidence pages:

- **ECMAScript built-ins support** — <https://ssjs.guide/ecmascript-builtins/>
- **Engine limitations** — <https://ssjs.guide/engine-limitations/>

Of unicorn's **300** recommended rules (v71.1.0), **254** are safe to keep on for SSJS and **46** should be turned off. `eslint-plugin-sfmc` ships an **optional** override config (`unicorn-ssjs` / `unicorn-ssjs-embedded`) that turns off exactly those 46 for SSJS files. `eslint-plugin-sfmc` does **not** depend on or load unicorn — the override only takes effect when you have loaded unicorn yourself. See [Section 1](#section-1--how-to-apply).

---

## Section 1 — How to apply

The override is **optional** and **SSJS-scoped**. `eslint-plugin-sfmc` never loads unicorn; the override is a plain rules object that only resolves when you have loaded your own unicorn config **earlier** in the flat-config array (that config registers the `unicorn` plugin). Spread the sfmc override **after** it:

```js
import sfmc from 'eslint-plugin-sfmc';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

export default [
    eslintPluginUnicorn.configs.recommended, // you opt in — registers the `unicorn` plugin
    ...sfmc.configs.recommended,
    ...sfmc.configs.embedded,                 // AMPscript + SSJS embedded in HTML (<script runat="server">)
    ...sfmc.configs['unicorn-ssjs'],          // OPTIONAL: off the 46 SFMC-incompatible unicorn rules for SSJS
    ...sfmc.configs['unicorn-ssjs-embedded'], // OPTIONAL: same override for SSJS embedded in HTML (<script runat="server">)
];
```

| Config | Applies to |
|---|---|
| `unicorn-ssjs` | `**/*.ssjs` |
| `unicorn-ssjs-embedded` | `**/*.html/*.js` (SSJS extracted from `<script runat="server">`) |

If you don't use unicorn, omit these configs entirely — nothing else in `eslint-plugin-sfmc` references them.

---

## Section 2 — Rules to override for SSJS (46)

These 46 recommended rules either **autofix code to a missing built-in**, **forbid a documented SFMC workaround**, or **enforce ES-module / async / ES6-only syntax** the engine cannot run. The override config sets each to `'off'` for SSJS. All 46 are confirmed `recommended` in unicorn v71.1.0.

### Group A — autofix to a missing built-in / forbid a SFMC workaround (41)

| Rule | Why it breaks SSJS | SFMC evidence |
|---|---|---|
| [`prefer-includes`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-includes.md) | Pushes `Array/String#includes()` — missing in SSJS | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-string-starts-ends-with`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-starts-ends-with.md) | Pushes `String#startsWith/endsWith` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-string-trim-start-end`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-trim-start-end.md) | Pushes `trimStart/trimEnd` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-string-slice`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-slice.md) | Forbids `substring`, the SFMC-safe choice | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-string-replace-all`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-replace-all.md) | Pushes `String#replaceAll` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-string-repeat`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-repeat.md) | Pushes `String#repeat` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-string-pad-start-end`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-pad-start-end.md) | Pushes `padStart/padEnd` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-string-match-all`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-match-all.md) | Pushes `String#matchAll` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-string-raw`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-string-raw.md) | Pushes `String.raw` tag — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-code-point`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-code-point.md) | Pushes `codePointAt/fromCodePoint` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-array-find`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-find.md) | Pushes `Array#find/findLast` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-array-some`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-some.md) | Pushes `Array#some` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-array-index-of`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-index-of.md) | Pushes `findIndex/findLastIndex` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-array-flat`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-flat.md) | Pushes `Array#flat` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-array-flat-map`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-flat-map.md) | Pushes `Array#flatMap` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-array-last-methods`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-last-methods.md) | Pushes `.at()/findLast` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-array-from-async`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-from-async.md) | Pushes `Array.fromAsync` — missing + async unsupported | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`no-array-reverse`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-reverse.md) | Autofixes to `Array#toReversed()` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-at`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-at.md) | Pushes `.at()` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-negative-index`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-negative-index.md) | Pushes `.at()` — missing; forbids the `.length - i` workaround | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-spread`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-spread.md) | Pushes spread `...` — ES6 syntax, throws on ES3 | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-date-now`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-date-now.md) | Pushes `Date.now()` — missing static | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-object-from-entries`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-object-from-entries.md) | Pushes `Object.fromEntries` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-reflect-apply`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-reflect-apply.md) | Pushes `Reflect.apply` — `Reflect` missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-number-properties`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-number-properties.md) | Pushes `Number.parseInt/parseFloat/isNaN/isFinite` statics — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-number-is-safe-integer`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-number-is-safe-integer.md) | Pushes `Number.isSafeInteger` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-number-coercion`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-number-coercion.md) | Number-static patterns unsafe on the ES3 engine | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-global-number-constants`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-global-number-constants.md) | Pushes `Number.NaN/Number.POSITIVE_INFINITY` etc. — missing statics | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-native-coercion-functions`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-native-coercion-functions.md) | Native coercion refs that are missing/unsafe | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-math-trunc`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-math-trunc.md) | Pushes `Math.trunc` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-modern-math-apis`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-modern-math-apis.md) | Pushes `Math.log10/log2/hypot` — missing; forbids `Math.log(x)/Math.LN10` and `Math.sqrt(a*a+b*b)` workarounds | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`no-instanceof-builtins`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-instanceof-builtins.md) | Autofixes `instanceof Array` to `Array.isArray` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`no-for-each`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-for-each.md) | Assumes `.forEach` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-set-has`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-set-has.md) | Pushes `Set` — ES6, unsupported | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-set-size`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-set-size.md) | Pushes `Set` — ES6, unsupported | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-set-methods`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-set-methods.md) | Pushes `Set` methods — ES2024, unsupported | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-map-from-entries`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-map-from-entries.md) | Pushes `Map` + `Object.fromEntries` — unsupported | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-group-by`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-group-by.md) | Pushes `Object.groupBy/Map.groupBy` — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`prefer-iterator-helpers`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-iterator-helpers.md) | Pushes the iterator-helper protocol — unsupported | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-structured-clone`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-structured-clone.md) | Pushes `structuredClone` global — missing | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |
| [`require-array-join-separator`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-array-join-separator.md) | Safe alone, but grouped here to avoid pushing modern array idioms under the strict set | [ECMAScript built-ins](https://ssjs.guide/ecmascript-builtins/) |

### Group B — forbid ES6+ syntax / ES-module / async constructs (5)

| Rule | Why it breaks SSJS | SFMC evidence |
|---|---|---|
| [`prefer-optional-catch-binding`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-optional-catch-binding.md) | Pushes `catch {}` (ES2019) — may not parse on ES3 | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-module`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-module.md) | Pushes ES modules — unsupported | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-node-protocol`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-node-protocol.md) | Pushes `node:` imports — no module system | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-top-level-await`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-top-level-await.md) | Pushes top-level `await` — async unsupported | [Engine limitations](https://ssjs.guide/engine-limitations/) |
| [`prefer-export-from`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-export-from.md) | Pushes `export … from` — ES modules | [Engine limitations](https://ssjs.guide/engine-limitations/) |

> **Note:** [`prefer-regexp-test`](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-regexp-test.md) stays **active** — `RegExp#test` exists in SFMC SSJS, so it is intentionally **not** in the override list.

---

## Section 3 — Rules OK as-is (254)

These recommended rules are **not** disabled by the override config. They are either genuinely SFMC-safe (readability / best-practice rules that work on the ES3/ES5 engine) or **inert** on SSJS — many target the DOM, Node.js, Promises, TypeScript, or ES modules and therefore never fire on server-side SFMC code. Each links to its official unicorn documentation.

<!-- BEGIN 254-OK-LIST -->
- [better-dom-traversing](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/better-dom-traversing.md)
- [catch-error-name](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/catch-error-name.md)
- [class-reference-in-static-methods](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/class-reference-in-static-methods.md)
- [consistent-assert](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-assert.md)
- [consistent-boolean-name](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-boolean-name.md)
- [consistent-class-member-order](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-class-member-order.md)
- [consistent-compound-words](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-compound-words.md)
- [consistent-conditional-object-spread](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-conditional-object-spread.md)
- [consistent-date-clone](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-date-clone.md)
- [consistent-empty-array-spread](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-empty-array-spread.md)
- [consistent-existence-index-check](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-existence-index-check.md)
- [consistent-export-decorator-position](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-export-decorator-position.md)
- [consistent-function-scoping](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-function-scoping.md)
- [consistent-json-file-read](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-json-file-read.md)
- [consistent-optional-chaining](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-optional-chaining.md)
- [consistent-template-literal-escape](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-template-literal-escape.md)
- [consistent-tuple-labels](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/consistent-tuple-labels.md)
- [default-export-style](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/default-export-style.md)
- [dom-node-dataset](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/dom-node-dataset.md)
- [empty-brace-spaces](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/empty-brace-spaces.md)
- [error-message](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/error-message.md)
- [escape-case](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/escape-case.md)
- [expiring-todo-comments](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/expiring-todo-comments.md)
- [explicit-length-check](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/explicit-length-check.md)
- [explicit-timer-delay](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/explicit-timer-delay.md)
- [filename-case](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/filename-case.md)
- [import-style](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/import-style.md)
- [isolated-functions](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/isolated-functions.md)
- [logical-assignment-operators](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/logical-assignment-operators.md)
- [max-nested-calls](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/max-nested-calls.md)
- [name-replacements](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/name-replacements.md)
- [new-for-builtins](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/new-for-builtins.md)
- [no-abusive-eslint-disable](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-abusive-eslint-disable.md)
- [no-accessor-recursion](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-accessor-recursion.md)
- [no-accidental-bitwise-operator](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-accidental-bitwise-operator.md)
- [no-anonymous-default-export](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-anonymous-default-export.md)
- [no-array-callback-reference](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-callback-reference.md)
- [no-array-concat-in-loop](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-concat-in-loop.md)
- [no-array-fill-with-reference-type](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-fill-with-reference-type.md)
- [no-array-from-fill](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-from-fill.md)
- [no-array-method-this-argument](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-method-this-argument.md)
- [no-array-reduce](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-reduce.md)
- [no-array-sort](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-sort.md)
- [no-array-sort-for-min-max](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-sort-for-min-max.md)
- [no-array-splice](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-splice.md)
- [no-async-promise-finally](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-async-promise-finally.md)
- [no-await-expression-member](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-await-expression-member.md)
- [no-await-in-promise-methods](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-await-in-promise-methods.md)
- [no-blob-to-file](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-blob-to-file.md)
- [no-boolean-sort-comparator](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-boolean-sort-comparator.md)
- [no-break-in-nested-loop](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-break-in-nested-loop.md)
- [no-canvas-to-image](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-canvas-to-image.md)
- [no-chained-comparison](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-chained-comparison.md)
- [no-collection-bracket-access](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-collection-bracket-access.md)
- [no-computed-property-existence-check](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-computed-property-existence-check.md)
- [no-confusing-array-splice](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-confusing-array-splice.md)
- [no-confusing-array-with](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-confusing-array-with.md)
- [no-console-spaces](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-console-spaces.md)
- [no-constant-zero-expression](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-constant-zero-expression.md)
- [no-declarations-before-early-exit](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-declarations-before-early-exit.md)
- [no-document-cookie](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-document-cookie.md)
- [no-double-comparison](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-double-comparison.md)
- [no-duplicate-if-branches](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-duplicate-if-branches.md)
- [no-duplicate-logical-operands](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-duplicate-logical-operands.md)
- [no-duplicate-loops](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-duplicate-loops.md)
- [no-duplicate-set-values](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-duplicate-set-values.md)
- [no-empty-file](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-empty-file.md)
- [no-error-property-assignment](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-error-property-assignment.md)
- [no-exports-in-scripts](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-exports-in-scripts.md)
- [no-for-loop](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-for-loop.md)
- [no-global-object-property-assignment](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-global-object-property-assignment.md)
- [no-immediate-mutation](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-immediate-mutation.md)
- [no-impossible-length-comparison](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-impossible-length-comparison.md)
- [no-incorrect-query-selector](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-incorrect-query-selector.md)
- [no-incorrect-template-string-interpolation](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-incorrect-template-string-interpolation.md)
- [no-invalid-argument-count](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-invalid-argument-count.md)
- [no-invalid-character-comparison](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-invalid-character-comparison.md)
- [no-invalid-fetch-options](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-invalid-fetch-options.md)
- [no-invalid-remove-event-listener](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-invalid-remove-event-listener.md)
- [no-invalid-well-known-symbol-methods](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-invalid-well-known-symbol-methods.md)
- [no-late-current-target-access](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-late-current-target-access.md)
- [no-late-event-control](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-late-event-control.md)
- [no-lonely-if](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-lonely-if.md)
- [no-loop-iterable-mutation](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-loop-iterable-mutation.md)
- [no-magic-array-flat-depth](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-magic-array-flat-depth.md)
- [no-mismatched-map-key](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-mismatched-map-key.md)
- [no-misrefactored-assignment](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-misrefactored-assignment.md)
- [no-named-default](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-named-default.md)
- [no-negated-array-predicate](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-negated-array-predicate.md)
- [no-negated-comparison](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-negated-comparison.md)
- [no-negated-condition](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-negated-condition.md)
- [no-negation-in-equality-check](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-negation-in-equality-check.md)
- [no-nested-ternary](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-nested-ternary.md)
- [no-new-array](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-new-array.md)
- [no-new-buffer](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-new-buffer.md)
- [no-non-function-verb-prefix](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-non-function-verb-prefix.md)
- [no-nonstandard-builtin-properties](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-nonstandard-builtin-properties.md)
- [no-null](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-null.md)
- [no-object-as-default-parameter](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-object-as-default-parameter.md)
- [no-object-methods-with-collections](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-object-methods-with-collections.md)
- [no-optional-chaining-on-undeclared-variable](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-optional-chaining-on-undeclared-variable.md)
- [no-process-exit](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-process-exit.md)
- [no-redundant-comparison](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-redundant-comparison.md)
- [no-return-array-push](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-return-array-push.md)
- [no-selector-as-dom-name](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-selector-as-dom-name.md)
- [no-single-promise-in-promise-methods](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-single-promise-in-promise-methods.md)
- [no-static-only-class](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-static-only-class.md)
- [no-subtraction-comparison](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-subtraction-comparison.md)
- [no-thenable](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-thenable.md)
- [no-this-assignment](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-this-assignment.md)
- [no-this-outside-of-class](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-this-outside-of-class.md)
- [no-top-level-assignment-in-function](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-top-level-assignment-in-function.md)
- [no-top-level-side-effects](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-top-level-side-effects.md)
- [no-typeof-undefined](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-typeof-undefined.md)
- [no-uncalled-method](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-uncalled-method.md)
- [no-undeclared-class-members](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-undeclared-class-members.md)
- [no-unnecessary-array-flat-depth](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-array-flat-depth.md)
- [no-unnecessary-array-flat-map](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-array-flat-map.md)
- [no-unnecessary-array-splice-count](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-array-splice-count.md)
- [no-unnecessary-await](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-await.md)
- [no-unnecessary-boolean-comparison](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-boolean-comparison.md)
- [no-unnecessary-fetch-options](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-fetch-options.md)
- [no-unnecessary-global-this](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-global-this.md)
- [no-unnecessary-nested-ternary](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-nested-ternary.md)
- [no-unnecessary-polyfills](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-polyfills.md)
- [no-unnecessary-slice-end](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-slice-end.md)
- [no-unnecessary-splice](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-splice.md)
- [no-unnecessary-string-trim](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-string-trim.md)
- [no-unreadable-array-destructuring](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unreadable-array-destructuring.md)
- [no-unreadable-for-of-expression](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unreadable-for-of-expression.md)
- [no-unreadable-iife](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unreadable-iife.md)
- [no-unreadable-object-destructuring](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unreadable-object-destructuring.md)
- [no-unsafe-buffer-conversion](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unsafe-buffer-conversion.md)
- [no-unsafe-promise-all-settled-values](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unsafe-promise-all-settled-values.md)
- [no-unsafe-property-key](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unsafe-property-key.md)
- [no-unsafe-string-replacement](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unsafe-string-replacement.md)
- [no-unused-array-method-return](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unused-array-method-return.md)
- [no-useless-boolean-cast](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-boolean-cast.md)
- [no-useless-coercion](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-coercion.md)
- [no-useless-collection-argument](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-collection-argument.md)
- [no-useless-compound-assignment](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-compound-assignment.md)
- [no-useless-concat](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-concat.md)
- [no-useless-continue](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-continue.md)
- [no-useless-delete-check](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-delete-check.md)
- [no-useless-else](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-else.md)
- [no-useless-error-capture-stack-trace](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-error-capture-stack-trace.md)
- [no-useless-fallback-in-spread](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-fallback-in-spread.md)
- [no-useless-iterator-to-array](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-iterator-to-array.md)
- [no-useless-length-check](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-length-check.md)
- [no-useless-logical-operand](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-logical-operand.md)
- [no-useless-override](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-override.md)
- [no-useless-promise-resolve-reject](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-promise-resolve-reject.md)
- [no-useless-recursion](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-recursion.md)
- [no-useless-spread](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-spread.md)
- [no-useless-switch-case](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-switch-case.md)
- [no-useless-template-literals](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-template-literals.md)
- [no-useless-undefined](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-undefined.md)
- [no-xor-as-exponentiation](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-xor-as-exponentiation.md)
- [no-zero-fractions](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-zero-fractions.md)
- [number-literal-case](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/number-literal-case.md)
- [numeric-separators-style](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/numeric-separators-style.md)
- [operator-assignment](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/operator-assignment.md)
- [prefer-abort-signal-any](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-abort-signal-any.md)
- [prefer-abort-signal-timeout](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-abort-signal-timeout.md)
- [prefer-add-event-listener](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-add-event-listener.md)
- [prefer-add-event-listener-options](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-add-event-listener-options.md)
- [prefer-aggregate-error](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-aggregate-error.md)
- [prefer-array-from-map](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-from-map.md)
- [prefer-array-from-range](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-from-range.md)
- [prefer-array-iterable-methods](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-iterable-methods.md)
- [prefer-array-slice](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-array-slice.md)
- [prefer-await](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-await.md)
- [prefer-bigint-literals](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-bigint-literals.md)
- [prefer-blob-reading-methods](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-blob-reading-methods.md)
- [prefer-block-statement-over-iife](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-block-statement-over-iife.md)
- [prefer-boolean-return](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-boolean-return.md)
- [prefer-class-fields](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-class-fields.md)
- [prefer-classlist-toggle](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-classlist-toggle.md)
- [prefer-continue](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-continue.md)
- [prefer-default-parameters](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-default-parameters.md)
- [prefer-direct-iteration](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-direct-iteration.md)
- [prefer-dom-node-append](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-append.md)
- [prefer-dom-node-remove](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-remove.md)
- [prefer-dom-node-replace-children](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-replace-children.md)
- [prefer-dom-node-text-content](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-dom-node-text-content.md)
- [prefer-early-return](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-early-return.md)
- [prefer-else-if](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-else-if.md)
- [prefer-event-target](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-event-target.md)
- [prefer-flat-math-min-max](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-flat-math-min-max.md)
- [prefer-get-or-insert-computed](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-get-or-insert-computed.md)
- [prefer-global-this](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-global-this.md)
- [prefer-has-check](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-has-check.md)
- [prefer-hoisting-branch-code](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-hoisting-branch-code.md)
- [prefer-https](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-https.md)
- [prefer-identifier-import-export-specifiers](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-identifier-import-export-specifiers.md)
- [prefer-includes-over-repeated-comparisons](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-includes-over-repeated-comparisons.md)
- [prefer-iterable-in-constructor](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-iterable-in-constructor.md)
- [prefer-iterator-to-array](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-iterator-to-array.md)
- [prefer-iterator-to-array-at-end](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-iterator-to-array-at-end.md)
- [prefer-keyboard-event-key](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-keyboard-event-key.md)
- [prefer-location-assign](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-location-assign.md)
- [prefer-logical-operator-over-ternary](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-logical-operator-over-ternary.md)
- [prefer-math-abs](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-math-abs.md)
- [prefer-math-constants](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-math-constants.md)
- [prefer-math-min-max](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-math-min-max.md)
- [prefer-minimal-ternary](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-minimal-ternary.md)
- [prefer-modern-dom-apis](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-modern-dom-apis.md)
- [prefer-object-define-properties](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-object-define-properties.md)
- [prefer-object-destructuring-defaults](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-object-destructuring-defaults.md)
- [prefer-object-iterable-methods](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-object-iterable-methods.md)
- [prefer-observer-apis](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-observer-apis.md)
- [prefer-path2d](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-path2d.md)
- [prefer-private-class-fields](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-private-class-fields.md)
- [prefer-promise-try](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-promise-try.md)
- [prefer-promise-with-resolvers](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-promise-with-resolvers.md)
- [prefer-prototype-methods](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-prototype-methods.md)
- [prefer-query-selector](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-query-selector.md)
- [prefer-queue-microtask](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-queue-microtask.md)
- [prefer-regexp-test](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-regexp-test.md)
- [prefer-response-static-json](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-response-static-json.md)
- [prefer-scoped-selector](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-scoped-selector.md)
- [prefer-simple-condition-first](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-simple-condition-first.md)
- [prefer-simple-sort-comparator](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-simple-sort-comparator.md)
- [prefer-simplified-conditions](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-simplified-conditions.md)
- [prefer-single-array-predicate](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-single-array-predicate.md)
- [prefer-single-call](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-single-call.md)
- [prefer-single-object-destructuring](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-single-object-destructuring.md)
- [prefer-single-replace](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-single-replace.md)
- [prefer-smaller-scope](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-smaller-scope.md)
- [prefer-split-limit](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-split-limit.md)
- [prefer-switch](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-switch.md)
- [prefer-ternary](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-ternary.md)
- [prefer-toggle-attribute](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-toggle-attribute.md)
- [prefer-type-error](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-type-error.md)
- [prefer-type-literal-last](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-type-literal-last.md)
- [prefer-unary-minus](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-unary-minus.md)
- [prefer-unicode-code-point-escapes](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-unicode-code-point-escapes.md)
- [prefer-url-can-parse](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-url-can-parse.md)
- [prefer-url-href](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-url-href.md)
- [prefer-url-search-parameters](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-url-search-parameters.md)
- [prefer-while-loop-condition](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-while-loop-condition.md)
- [relative-url-style](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/relative-url-style.md)
- [require-array-sort-compare](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-array-sort-compare.md)
- [require-css-escape](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-css-escape.md)
- [require-module-attributes](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-module-attributes.md)
- [require-module-specifiers](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-module-specifiers.md)
- [require-number-to-fixed-digits-argument](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-number-to-fixed-digits-argument.md)
- [require-passive-events](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-passive-events.md)
- [require-proxy-trap-boolean-return](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/require-proxy-trap-boolean-return.md)
- [switch-case-braces](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/switch-case-braces.md)
- [switch-case-break-position](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/switch-case-break-position.md)
- [template-indent](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/template-indent.md)
- [text-encoding-identifier-case](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/text-encoding-identifier-case.md)
- [throw-new-error](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/throw-new-error.md)
<!-- END 254-OK-LIST -->

