# `sfmc/ssjs-no-hardcoded-credentials`

> Disallow hardcoded keys, IVs, or salts in encryption/decryption calls.

| | |
|---|---|
| **Type** | `problem` |
| **Default severity** | `error` in `recommended` and `strict` |
| **Fixable** | — |

## Why This Rule Exists

Hardcoding cryptographic keys, initialisation vectors, or salts as string literals in `Platform.Function.EncryptSymmetric` or `Platform.Function.DecryptSymmetric` calls is a security risk. The values are visible in plain text inside your content template, accessible to anyone with access to the Marketing Cloud account or its version history. Credentials should be stored in a Data Extension and retrieved at runtime so they are never committed to templates directly.

## Settings

| Setting | Values | Default |
|---------|--------|---------|
| severity | `"error"` \| `"warn"` \| `"off"` | `"error"` |

This rule has no configuration options.

The rule flags string literals at argument positions 1, 3, 5, and 7 (the key, IV, salt, and additional-key positions) of `EncryptSymmetric` and `DecryptSymmetric` calls.

### Examples

**Not allowed:**

```js
Platform.Load("core", "1.1.5");
var encrypted = Platform.Function.EncryptSymmetric(plaintext, "AES", "my-secret-key", null, null, null);
var decrypted = Platform.Function.DecryptSymmetric(ciphertext, "AES", "my-secret-key", null, null, null);
```

**Allowed:**

```js
Platform.Load("core", "1.1.5");
var de = DataExtension.Init("EncryptionKeys");
var filter = { Property: "Name", SimpleOperator: "equals", Value: "AES_KEY" };
var rows = de.Rows.Lookup([filter]);
var key = Platform.Function.Field(Platform.Function.Row(rows, 1), "KeyValue");

var encrypted = Platform.Function.EncryptSymmetric(plaintext, "AES", key, null, null, null);
```

## When to Disable

```js
// eslint.config.js
rules: { 'sfmc/ssjs-no-hardcoded-credentials': 'off' }
```
