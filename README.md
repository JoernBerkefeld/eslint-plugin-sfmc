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

## Configs

| Config                     | Files                        | What it does                                              |
| -------------------------- | ---------------------------- | --------------------------------------------------------- |
| `sfmc.configs.ampscript`   | `**/*.ampscript`, `**/*.amp` | AMPscript rules only (recommended severity)               |
| `sfmc.configs.ssjs`        | `**/*.ssjs`                  | SSJS rules only (recommended severity)                    |
| `sfmc.configs.recommended` | Both of the above            | All rules at recommended severity for standalone files    |
| `sfmc.configs.embedded`    | `**/*.html`                  | Combined processor extracts both languages from HTML      |
| `sfmc.configs.strict`      | All of the above + HTML      | All rules at `error` severity for standalone and embedded |

`recommended`, `embedded`, and `strict` are arrays — spread them with `...`.

## AMPscript Rules (`amp-*`)

| Rule                                                                                        | Default | Description                                                  |
| ------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| [`sfmc/amp-no-unknown-function`](docs/rules/amp/no-unknown-function.md)                     | `error` | Disallow calls to unknown AMPscript functions                |
| [`sfmc/amp-function-arity`](docs/rules/amp/function-arity.md)                               | `error` | Enforce correct argument counts                              |
| [`sfmc/amp-set-requires-target`](docs/rules/amp/set-requires-target.md)                     | `error` | Require `set` to have a target variable                      |
| [`sfmc/amp-no-smart-quotes`](docs/rules/amp/no-smart-quotes.md)                             | `error` | Disallow smart/curly quotes in strings                       |
| [`sfmc/amp-no-var-redeclaration`](docs/rules/amp/no-var-redeclaration.md)                   | `warn`  | Disallow re-declaring a variable with `var`                  |
| [`sfmc/amp-no-empty-block`](docs/rules/amp/no-empty-block.md)                               | `warn`  | Disallow empty `%%[ ]%%` blocks                              |
| [`sfmc/amp-no-loop-counter-assign`](docs/rules/amp/no-loop-counter-assign.md)               | `warn`  | Disallow assigning to the `for` loop counter                 |
| [`sfmc/amp-no-inline-statement`](docs/rules/amp/no-inline-statement.md)                     | `warn`  | Disallow statements inside inline expressions                |
| [`sfmc/amp-no-deprecated-function`](docs/rules/amp/no-deprecated-function.md)               | `warn`  | Flag deprecated functions and suggest replacements           |
| [`sfmc/amp-naming-convention`](docs/rules/amp/naming-convention.md)                         | `warn`  | Enforce variable naming convention                           |
| [`sfmc/amp-no-empty-then`](docs/rules/amp/no-empty-then.md)                                 | `warn`  | Disallow IF with empty THEN branch                           |
| [`sfmc/amp-require-rowcount-check`](docs/rules/amp/require-rowcount-check.md)               | `warn`  | Require RowCount check before FOR on LookupRows              |
| [`sfmc/amp-no-html-comment`](docs/rules/amp/no-html-comment.md)                             | `warn`  | Disallow HTML comments inside AMPscript blocks               |
| [`sfmc/amp-no-js-line-comment`](docs/rules/amp/no-js-line-comment.md)                       | `warn`  | Disallow JS-style `//` line comments in AMPscript            |
| [`sfmc/amp-no-nested-script-tag`](docs/rules/amp/no-nested-script-tag.md)                   | `error` | Disallow `<script>` tags nested inside AMPscript script tags |
| [`sfmc/amp-no-nested-ampscript-delimiter`](docs/rules/amp/no-nested-ampscript-delimiter.md) | `error` | Disallow AMPscript delimiters nested inside AMPscript blocks |
| [`sfmc/amp-prefer-attribute-value`](docs/rules/amp/prefer-attribute-value.md)               | off     | Prefer `AttributeValue()` over bare personalization          |
| [`sfmc/amp-require-variable-declaration`](docs/rules/amp/require-variable-declaration.md)   | off     | Require `var` before `set`                                   |
| [`sfmc/amp-no-email-excluded-function`](docs/rules/amp/no-email-excluded-function.md)       | off     | Flag functions unavailable in email context                  |

## SSJS Rules (`ssjs-*`)

| Rule                                                                                                    | Default | Description                                                          |
| ------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| [`sfmc/ssjs-require-platform-load`](docs/rules/ssjs/require-platform-load.md)                           | `error` | Require `Platform.Load("core")` before Core usage                    |
| [`sfmc/ssjs-no-unsupported-syntax`](docs/rules/ssjs/no-unsupported-syntax.md)                           | `error` | Flag ES6+ syntax not supported by SFMC                               |
| [`sfmc/ssjs-no-unknown-platform-function`](docs/rules/ssjs/no-unknown-platform-function.md)             | `error` | Disallow unknown `Platform.Function.*` methods                       |
| [`sfmc/ssjs-platform-function-arity`](docs/rules/ssjs/platform-function-arity.md)                       | `error` | Enforce correct arity for `Platform.Function.*`                      |
| [`sfmc/ssjs-no-unknown-http-method`](docs/rules/ssjs/no-unknown-http-method.md)                         | `error` | Disallow unknown `HTTP.*` methods                                    |
| [`sfmc/ssjs-no-unknown-platform-variable`](docs/rules/ssjs/no-unknown-platform-variable.md)             | `error` | Disallow unknown `Platform.Variable.*` methods                       |
| [`sfmc/ssjs-no-unknown-platform-response`](docs/rules/ssjs/no-unknown-platform-response.md)             | `error` | Disallow unknown `Platform.Response.*` methods                       |
| [`sfmc/ssjs-no-unknown-platform-request`](docs/rules/ssjs/no-unknown-platform-request.md)               | `error` | Disallow unknown `Platform.Request.*` methods                        |
| [`sfmc/ssjs-require-platform-load-order`](docs/rules/ssjs/require-platform-load-order.md)               | `error` | Require `Platform.Load()` before Core usage in order                 |
| [`sfmc/ssjs-no-hardcoded-credentials`](docs/rules/ssjs/no-hardcoded-credentials.md)                     | `error` | Flag hardcoded keys in encryption calls                              |
| [`sfmc/ssjs-no-unknown-platform-client-browser`](docs/rules/ssjs/no-unknown-platform-client-browser.md) | `error` | Disallow unknown `Platform.ClientBrowser.*` methods                  |
| [`sfmc/ssjs-no-unknown-core-method`](docs/rules/ssjs/no-unknown-core-method.md)                         | `warn`  | Disallow unknown methods on Core library objects                     |
| [`sfmc/ssjs-no-unknown-wsproxy-method`](docs/rules/ssjs/no-unknown-wsproxy-method.md)                   | `warn`  | Disallow unknown WSProxy methods                                     |
| [`sfmc/ssjs-cache-loop-length`](docs/rules/ssjs/cache-loop-length.md)                                   | `warn`  | Require caching `.length` in for-loops                               |
| [`sfmc/ssjs-require-hasownproperty`](docs/rules/ssjs/require-hasownproperty.md)                         | `warn`  | Require `hasOwnProperty` guard in for-in loops                       |
| [`sfmc/ssjs-prefer-platform-load-version`](docs/rules/ssjs/prefer-platform-load-version.md)             | `warn`  | Enforce a minimum `Platform.Load` version string                     |
| [`sfmc/ssjs-no-unavailable-method`](docs/rules/ssjs/no-unavailable-method.md)                           | `warn`  | Flag Array/String methods unavailable or broken in SFMC's ES3 engine |
| [`sfmc/ssjs-prefer-parsejson-safe-arg`](docs/rules/ssjs/prefer-parsejson-safe-arg.md)                   | `warn`  | Require string coercion on `ParseJSON` argument                      |
| [`sfmc/ssjs-no-switch-default`](docs/rules/ssjs/no-switch-default.md)                                   | `warn`  | Disallow `default` clause in `switch` statements                     |
| [`sfmc/ssjs-no-treatascontent-injection`](docs/rules/ssjs/no-treatascontent-injection.md)               | `warn`  | Flag dynamic string concatenation in `TreatAsContent` calls          |

## Processors

| Processor        | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `sfmc/ampscript` | Extract `%%[ ]%%`, `%%= =%%`, `<script language="ampscript">` |
| `sfmc/ssjs`      | Extract `<script runat="server">` (non-ampscript)             |
| `sfmc/sfmc`      | Combined: extracts both AMPscript and SSJS from HTML          |

## License

MIT
