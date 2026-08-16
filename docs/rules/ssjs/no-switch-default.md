# `sfmc/ssjs-no-switch-default`

Discourage relying on a `default` case in `switch` statements.

## Why

Community lore held that the `default` case of a `switch` "may not execute" in SFMC SSJS. Live CloudPage probing disproved that framing: a last-clause `default` on a no-match path executes reliably.

The real defect is in the underlying [Jint](https://github.com/sebastienros/jint) engine that SFMC SSJS runs on. Because of [jint#2607](https://github.com/sebastienros/jint/pull/2607), an executed `break` inside a `switch` that sits inside a **function** can abnormally complete the function — the function returns `undefined` and any statements after the `switch` are skipped. The fault is intermittent across compilations. When the swallowed code was the caller's fallback (often reached via `default`), it looks like "`default` didn't run", but the trigger is the executed `break`, not the `default` keyword.

Detecting the `break`-in-function-scoped-`switch` case precisely is out of scope for a lint rule, so this rule flags the `default` clause as a cheap heuristic hint: a `switch` that leans on `default` is exactly the shape most likely to depend on this fragile control flow.

## Recommended approach

Prefer a lookup map or `if`/`else if` for control flow that must survive a `break`:

```js
// Bad -- function-scoped switch/break; return may be skipped, caller sees undefined
function classify(status) {
    var out = 'PRE';
    switch (status) {
        case 'active':
            out = 'A';
            break;
        default:
            out = 'DEF';
    }
    return out;
}

// Good -- lookup map, no switch/break to escape
function classify(status) {
    var map = { active: 'A' };
    return map[status] || 'DEF';
}

// Good -- if / else if
function classify(status) {
    if (status === 'active') return 'A';
    return 'DEF';
}
```

## Related

- ssjs.guide known bug: [`switch` `break` can escape a function](https://ssjs.guide/engine-limitations/known-bugs/#switch-break-escape)
- Upstream fix: [jint#2607](https://github.com/sebastienros/jint/pull/2607)

## Settings

This rule has no options.
