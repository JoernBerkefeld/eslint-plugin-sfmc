# eslint-plugin-sfmc

Unified ESLint plugin for **Salesforce Marketing Cloud** — linting rules for both **AMPscript** and **Server-Side JavaScript (SSJS)**.

## Installation

```bash
npm install eslint-plugin-sfmc --save-dev
```

Requires ESLint 9+ (flat config).

## Quick Start

```js
// eslint.config.js
import sfmc from 'eslint-plugin-sfmc';

export default [
  // Lint standalone .ampscript/.amp and .ssjs files
  ...sfmc.configs.recommended,

  // Lint AMPscript + SSJS embedded in .html files
  ...sfmc.configs.embedded,
];
```

## VS Code Setup

To see `eslint(sfmc/...)` diagnostics in VS Code for `.amp`, `.ssjs`, and `.html` files you need the [VS Code ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to validate the custom SFMC language IDs.

**Option A — Install `vscode-sfmc-language`** (recommended)

The [SFMC Language Service extension](https://marketplace.visualstudio.com/items?itemName=joernberkefeld.sfmc-language) contributes the SFMC language IDs **and** automatically configures `eslint.validate` for you. No manual settings required.

**Option B — Manual configuration**

Add the following to your `.vscode/settings.json`:

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "html",
    "vue",
    "markdown",
    "ampscript",
    "ssjs",
    "sfmc",
    "handlebars"
  ]
}
```

> **Why `eslint.validate` and not `eslint.probe`?** `eslint.probe` silently skips files for language IDs that the ESLint extension does not natively recognise. `eslint.validate` forces the extension to process those files regardless of language ID.

## Configs

### Marketing Cloud Engagement (default)

| Config                     | Files                        | What it does                                              |
| -------------------------- | ---------------------------- | --------------------------------------------------------- |
| `sfmc.configs.ampscript`   | `**/*.ampscript`, `**/*.amp` | AMPscript rules only (recommended severity)               |
| `sfmc.configs.ssjs`        | `**/*.ssjs`                  | SSJS rules only (recommended severity)                    |
| `sfmc.configs.recommended` | Both of the above            | All rules at recommended severity for standalone files    |
| `sfmc.configs.embedded`    | `**/*.html`                  | Combined processor extracts both languages from HTML      |
| `sfmc.configs.strict`      | All of the above + HTML      | All rules at `error` severity for standalone and embedded |

`recommended`, `embedded`, and `strict` are arrays — spread them with `...`.

### Marketing Cloud Next

Use the `-next` config variants when targeting **Marketing Cloud Next (MCN)**. MCN supports only a subset of AMPscript functions and does **not** support SSJS at all. Handlebars is MCN's templating language, so the `embedded-next` and `strict-next` configs also lint the `{{...}}` helpers and `{!$...}` bindings extracted from HTML (see [Handlebars Rules](#handlebars-rules-hbs-)).

| Config                             | Files                        | What it does                                                                                |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| `sfmc.configs['ampscript-next']`   | `**/*.ampscript`, `**/*.amp` | AMPscript rules + flags functions unsupported in MCN (single config object)                 |
| `sfmc.configs['ssjs-next']`        | `**/*.ssjs`                  | Flags all SSJS API calls as MCN-unsupported; all other SSJS quality rules disabled          |
| `sfmc.configs['recommended-next']` | Both of the above            | AMPscript MCN-aware + SSJS flagged for standalone files                                     |
| `sfmc.configs['embedded-next']`    | `**/*.html`                  | AMPscript MCN-aware + SSJS flagged + Handlebars rules for HTML-embedded code                |
| `sfmc.configs['strict-next']`      | All of the above + HTML      | All AMPscript rules at `error` severity + MCN flag; SSJS fully flagged; Handlebars rules on |

`recommended-next`, `embedded-next`, and `strict-next` are arrays — spread them with `...`.

```js
// eslint.config.js — targeting Marketing Cloud Next
import sfmc from 'eslint-plugin-sfmc';

export default [...sfmc.configs['recommended-next'], ...sfmc.configs['embedded-next']];
```

## AMPscript Rules (`amp-*`)

| Rule                                                                                        | Default                  | Description                                                                         |
| ------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| [`sfmc/amp-no-unknown-function`](docs/rules/amp/no-unknown-function.md)                     | `error`                  | Disallow calls to unknown AMPscript functions                                       |
| [`sfmc/amp-no-mcn-unsupported`](docs/rules/amp/no-mcn-unsupported.md)                       | off (`error` in `-next`) | Flag AMPscript functions unavailable in the targeted MCN API version (`apiVersion`) |
| [`sfmc/amp-function-arity`](docs/rules/amp/function-arity.md)                               | `error`                  | Enforce correct argument counts                                                     |
| [`sfmc/amp-arg-types`](docs/rules/amp/arg-types.md)                                         | `error`                  | Check that literal arguments match expected parameter types and allowed values      |
| [`sfmc/amp-set-requires-target`](docs/rules/amp/set-requires-target.md)                     | `error`                  | Require `set` to have a target variable                                             |
| [`sfmc/amp-no-smart-quotes`](docs/rules/amp/no-smart-quotes.md)                             | `error`                  | Disallow smart/curly quotes in strings                                              |
| [`sfmc/amp-no-var-redeclaration`](docs/rules/amp/no-var-redeclaration.md)                   | `warn`                   | Disallow re-declaring a variable with `var`                                         |
| [`sfmc/amp-no-empty-block`](docs/rules/amp/no-empty-block.md)                               | `warn`                   | Disallow empty `%%[ ]%%` blocks                                                     |
| [`sfmc/amp-no-loop-counter-assign`](docs/rules/amp/no-loop-counter-assign.md)               | `warn`                   | Disallow assigning to the `for` loop counter                                        |
| [`sfmc/amp-no-inline-statement`](docs/rules/amp/no-inline-statement.md)                     | `warn`                   | Disallow statements inside inline expressions                                       |
| [`sfmc/amp-no-deprecated-function`](docs/rules/amp/no-deprecated-function.md)               | `warn`                   | Flag deprecated functions and suggest replacements                                  |
| [`sfmc/amp-naming-convention`](docs/rules/amp/naming-convention.md)                         | `warn`                   | Enforce variable naming convention                                                  |
| [`sfmc/amp-no-empty-then`](docs/rules/amp/no-empty-then.md)                                 | `warn`                   | Disallow IF with empty THEN branch                                                  |
| [`sfmc/amp-require-rowcount-check`](docs/rules/amp/require-rowcount-check.md)               | `warn`                   | Require RowCount check before FOR on LookupRows                                     |
| [`sfmc/amp-no-html-comment`](docs/rules/amp/no-html-comment.md)                             | `warn`                   | Disallow HTML comments inside AMPscript blocks                                      |
| [`sfmc/amp-no-js-line-comment`](docs/rules/amp/no-js-line-comment.md)                       | `warn`                   | Disallow JS-style `//` line comments in AMPscript                                   |
| [`sfmc/amp-no-nested-script-tag`](docs/rules/amp/no-nested-script-tag.md)                   | `error`                  | Disallow `<script>` tags nested inside AMPscript script tags                        |
| [`sfmc/amp-no-nested-ampscript-delimiter`](docs/rules/amp/no-nested-ampscript-delimiter.md) | `error`                  | Disallow AMPscript delimiters nested inside AMPscript blocks                        |
| [`sfmc/amp-prefer-attribute-value`](docs/rules/amp/prefer-attribute-value.md)               | off                      | Prefer `AttributeValue()` over bare personalization                                 |
| [`sfmc/amp-require-variable-declaration`](docs/rules/amp/require-variable-declaration.md)   | off                      | Require `var` before `set`                                                          |
| [`sfmc/amp-no-email-excluded-function`](docs/rules/amp/no-email-excluded-function.md)       | off                      | Flag functions unavailable in email context                                         |

## SSJS Rules (`ssjs-*`)

| Rule                                                                                        | Default                  | Description                                                              |
| ------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| [`sfmc/ssjs-require-platform-load`](docs/rules/ssjs/require-platform-load.md)               | `error`                  | Require `Platform.Load("core")` before Core or requiresCoreLoad globals  |
| [`sfmc/ssjs-no-unsupported-syntax`](docs/rules/ssjs/no-unsupported-syntax.md)               | `error`                  | Flag ES6+ syntax not supported by SFMC                                   |
| [`sfmc/ssjs-no-unknown-function`](docs/rules/ssjs/no-unknown-function.md)                   | `error`                  | Disallow unknown methods on Platform.\*, HTTP, Core Library, and WSProxy |
| [`sfmc/ssjs-no-mcn-unsupported`](docs/rules/ssjs/no-mcn-unsupported.md)                     | off (`error` in `-next`) | Flag all SSJS API usage as unsupported in Marketing Cloud Next           |
| [`sfmc/ssjs-no-deprecated-function`](docs/rules/ssjs/no-deprecated-function.md)             | `error`                  | Flag use of deprecated SFMC SSJS APIs (e.g. ContentArea, ContentAreaObj) |
| [`sfmc/ssjs-no-property-call`](docs/rules/ssjs/no-property-call.md)                         | `error`                  | Disallow calling Platform.Request/Response properties as functions       |
| [`sfmc/ssjs-platform-function-arity`](docs/rules/ssjs/platform-function-arity.md)           | `error`                  | Enforce correct arity for `Platform.Function.*`                          |
| [`sfmc/ssjs-require-platform-load-order`](docs/rules/ssjs/require-platform-load-order.md)   | `error`                  | Require `Platform.Load()` before Core usage in order                     |
| [`sfmc/ssjs-no-hardcoded-credentials`](docs/rules/ssjs/no-hardcoded-credentials.md)         | `error`                  | Flag hardcoded keys in encryption calls                                  |
| [`sfmc/ssjs-cache-loop-length`](docs/rules/ssjs/cache-loop-length.md)                       | `warn`                   | Require caching `.length` in for-loops                                   |
| [`sfmc/ssjs-require-hasownproperty`](docs/rules/ssjs/require-hasownproperty.md)             | `warn`                   | Require `hasOwnProperty` guard in for-in loops                           |
| [`sfmc/ssjs-prefer-platform-load-version`](docs/rules/ssjs/prefer-platform-load-version.md) | `warn`                   | Enforce a minimum `Platform.Load` version string                         |
| [`sfmc/ssjs-no-unavailable-method`](docs/rules/ssjs/no-unavailable-method.md)               | `warn`                   | Flag Array/String methods unavailable or broken in SFMC's ES3 engine     |
| [`sfmc/ssjs-prefer-parsejson-safe-arg`](docs/rules/ssjs/prefer-parsejson-safe-arg.md)       | `warn`                   | Require string coercion on `ParseJSON` argument                          |
| [`sfmc/ssjs-no-switch-default`](docs/rules/ssjs/no-switch-default.md)                       | `warn`                   | Disallow `default` clause in `switch` statements                         |
| [`sfmc/ssjs-no-treatascontent-injection`](docs/rules/ssjs/no-treatascontent-injection.md)   | `warn`                   | Flag dynamic string concatenation in `TreatAsContent` calls              |
| [`sfmc/ssjs-core-method-arity`](docs/rules/ssjs/core-method-arity.md)                       | `warn`                   | Enforce correct argument counts for Core Library object methods          |
| [`sfmc/ssjs-arg-types`](docs/rules/ssjs/arg-types.md)                                       | `warn`                   | Check that literal arguments match expected parameter types              |

## Handlebars Rules (`hbs-*`)

Handlebars is the templating language for **Marketing Cloud Next (MCN)** only. These rules are enabled at `error` severity in the `-next` configs and are `off` in the classic (Engagement) configs — in classic SFMC, `{{...}}` is plain content and must not be flagged.

| Rule                                                                              | Default (`-next`) | Description                                                                          |
| --------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| [`sfmc/hbs-no-unknown-helper`](docs/rules/hbs/no-unknown-helper.md)               | `error`           | Disallow helper invocations that are not part of the MCN catalog                     |
| [`sfmc/hbs-no-unknown-binding`](docs/rules/hbs/no-unknown-binding.md)             | `error`           | Disallow unknown `{!$...}` built-in data bindings                                    |
| [`sfmc/hbs-helper-arity`](docs/rules/hbs/helper-arity.md)                         | `error`           | Enforce correct positional-argument counts for known helpers                         |
| [`sfmc/hbs-no-unsupported-construct`](docs/rules/hbs/no-unsupported-construct.md) | `error`           | Disallow constructs unsupported by the MCN engine (partials, decorators, `log`)      |
| [`sfmc/hbs-no-mcn-unsupported`](docs/rules/hbs/no-mcn-unsupported.md)             | `error`           | Flag helpers and bindings unavailable in the targeted MCN API version (`apiVersion`) |

## Processors

| Processor        | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `sfmc/ampscript` | Extract `%%[ ]%%`, `%%= =%%`, `<script language="ampscript">` |
| `sfmc/ssjs`      | Extract `<script runat="server">` (non-ampscript)             |
| `sfmc/sfmc`      | Combined: extracts both AMPscript and SSJS from HTML          |

## License

MIT
