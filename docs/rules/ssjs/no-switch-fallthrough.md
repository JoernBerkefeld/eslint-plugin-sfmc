# `sfmc/ssjs-no-switch-fallthrough`

Flag switch clauses that appear to depend on execution continuing into the next clause.

## Why

Marketing Cloud Engagement's SSJS engine does not implement JavaScript switch fall-through. Stacked labels therefore do not share the following body, and an unterminated case does not execute the next case's statements. Code that assumes either behavior can silently skip work.

## What this rule reports

- An empty case or default clause before another clause: for example, two adjacent case labels with a single shared body.
- A non-final clause whose last statement is not a break, return, throw, or continue: for example, an assignment followed immediately by the next case label.

The final clause is not reported because there is no subsequent clause to enter. A non-final clause ending directly in a terminating statement is accepted. This is a structural check, not control-flow analysis: a clause ending in an if statement can still be reported even when all its branches return.

## How to fix

Use an if/else chain when multiple values should perform the same work. Alternatively, give each case its own explicit body and terminator rather than stacking labels or expecting execution to cascade. A final clause needs no fall-through correction.

Adding break makes intent explicit, but does not repair code that actually needs the next case's work. Move that shared work into an explicit shared path instead. Also consider the separate function-scoped switch/break engine hazard described by [no-switch-default](no-switch-default.md); an if/else chain avoids both issues.

## Configuration and applicability

This rule has no options or automatic fix. It is enabled at warning severity in the Engagement recommended and embedded configurations, and error severity in strict configurations. It applies to standalone and HTML-embedded SSJS. Next configurations disable this rule and report SSJS as unsupported instead.

To suppress an intentional empty or unterminated clause, configure `sfmc/ssjs-no-switch-fallthrough` as `off`, or use a narrowly scoped ESLint disable-next-line comment naming this rule and explaining why the clause does not depend on fall-through. Replace `sfmc` with your configured plugin namespace if using an alias.
