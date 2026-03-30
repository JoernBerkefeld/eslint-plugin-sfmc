# ssjs-prefer-parsejson-safe-arg

Require concatenating an empty string to `Platform.Function.ParseJSON()` arguments.

## Why

`Platform.Function.ParseJSON()` throws a 500 error at runtime if its argument is `undefined` or not a string. This commonly happens when the value comes from a lookup, request parameter, or variable that may be empty.

Concatenating an empty string (`+ ''`) is a widely-used SFMC pattern that safely coerces the argument to a string:

```js
// Unsafe -- throws 500 if someVar is undefined
Platform.Function.ParseJSON(someVar);

// Safe
Platform.Function.ParseJSON(someVar + '');
```

## Rule details

This rule flags any call to `ParseJSON` (or `Platform.Function.ParseJSON`) where the first argument is not already concatenated with an empty string literal.

**Auto-fix:** The rule wraps the argument with `+ ''`.

### Valid

```js
Platform.Function.ParseJSON(someVar + '');
Platform.Function.ParseJSON('' + someVar);
Platform.Function.ParseJSON('{"key": "value"}');
```

### Invalid

```js
Platform.Function.ParseJSON(someVar);
Platform.Function.ParseJSON(getData());
```

## Settings

This rule has no options.
