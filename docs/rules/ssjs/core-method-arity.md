# `sfmc/ssjs-core-method-arity`

> Enforce correct argument counts for Core Library object method calls.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `warn` in `recommended`; `error` in `strict` |
| **Fixable** | — |

## Why This Rule Exists

Every method on a Core Library object has a documented minimum and maximum argument count. Passing too few arguments causes a runtime error; passing too many may fail silently or behave unexpectedly. This rule validates every Core Library method call against the known min/max argument counts from the ssjs-data catalog.

## Coverage

Both **static** and **instance** call styles are covered:

| Style | Example |
|---|---|
| Instance | `var de = DataExtension.Init("MyDE"); de.Add(row);` |
| Static single-name | `BounceEvent.Retrieve(filter);` |
| Static multi-part | `DataExtension.Rows.Add(rowObj);` |
| Deep chain | `TriggeredSend.Tracking.Clicks.Retrieve(filter);` |

Covered Core Library classes: `Account`, `Account.Tracking`, `AccountUser`, `Portfolio`, `ContentAreaObj`, `Folder`, `Template`, `DeliveryProfile`, `SenderProfile`, `SendClassification`, `FilterDefinition`, `QueryDefinition`, `List`, `List.Subscribers`, `List.Subscribers.Tracking`, `Subscriber`, `Subscriber.Attributes`, `Subscriber.Lists`, `Email`, `Send`, `Send.Tracking`, `Send.Definition`, `TriggeredSend`, `TriggeredSend.Tracking`, `TriggeredSend.Tracking.Clicks`, `TriggeredSend.Tracking.TotalByInterval`, `DataExtension`, `DataExtension.Fields`, `DataExtension.Rows`, `DateTime.TimeZone` — and event classes: `BounceEvent`, `ClickEvent`, `OpenEvent`, `SentEvent`, `UnsubEvent`, `ForwardedEmailEvent`, `ForwardedEmailOptInEvent`, `SurveyEvent`.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"warn"` (`"error"` in `strict`) |

This rule has no configuration options.

## Examples

**Not allowed:**

```js
Platform.Load("core", "1.1.5");

/* DataExtension.Rows.Add requires exactly 1 argument */
DataExtension.Rows.Add("MyDE", extraArg);

/* BounceEvent.Retrieve requires exactly 1 argument */
BounceEvent.Retrieve();

/* de.Add requires exactly 1 argument */
var de = DataExtension.Init("MyDE");
de.Add(rowObj, extraArg);
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");

DataExtension.Rows.Add(rowObj);

BounceEvent.Retrieve({ Property: "ID", SimpleOperator: "isNotNull", Value: "" });

var de = DataExtension.Init("MyDE");
de.Add(rowObj);
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-core-method-arity': 'off' }
```
