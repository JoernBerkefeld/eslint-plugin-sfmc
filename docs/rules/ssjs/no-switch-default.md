# ssjs-no-switch-default

Disallow `default` case in `switch` statements.

## Why

SFMC's SSJS engine may silently skip the `default` case in `switch` statements. This is a known engine bug that causes code in the `default` block to never execute, leading to hard-to-debug logic errors.

## Recommended approach

Enumerate all expected values as explicit `case` labels:

```js
// Bad -- 'default' may not execute
switch (status) {
    case 'active':
        doActive();
        break;
    default:
        doFallback();
        break;
}

// Good -- explicit cases
switch (status) {
    case 'active':
        doActive();
        break;
    case 'inactive':
        doFallback();
        break;
}
```

## Settings

This rule has no options.
