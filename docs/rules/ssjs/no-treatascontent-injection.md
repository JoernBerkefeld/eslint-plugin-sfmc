# ssjs-no-treatascontent-injection

Disallow string concatenation inside `TreatAsContent()` calls.

## Why

`Platform.Function.TreatAsContent()` evaluates its string argument as AMPscript. When dynamic values are concatenated into that string, an attacker (or unexpected data containing AMPscript syntax) can inject and execute arbitrary AMPscript code.

## Unsafe pattern

```js
// UNSAFE -- 'string' could contain AMPscript code
Platform.Function.TreatAsContent('%%[ Set @x = Trim("' + string + '")]%%');
```

## Safe pattern

Pass dynamic values through `Variable.SetValue()` first, then reference the AMPscript variable inside `TreatAsContent()`:

```js
// SAFE -- no user data in the AMPscript string
Variable.SetValue('@input', string);
Platform.Function.TreatAsContent('%%[ Set @x = Trim(@input) ]%%');
var result = Variable.GetValue('@x');
```

This approach ensures that dynamic values are never interpreted as AMPscript instructions.

## Rule details

This rule flags `TreatAsContent()` and `Platform.Function.TreatAsContent()` calls where the first argument contains:

- String concatenation (`+` operator)
- Template literals with expressions (`` `...${expr}...` ``)

## Settings

This rule has no options.
