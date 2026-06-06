/* ── Rule: sfmc/ssjs-no-hardcoded-credentials ───────────────────────────────────
   Flags hardcoded string literals for keys, IVs, or salts in
   Platform.Function.DecryptSymmetric / EncryptSymmetric calls.
   Use variables or DE lookups instead.
   ─────────────────────────────────────────────────────────────────────────── */

Platform.Load("Core", "1.1.5");

var encryptedValue = "U2FsdGVkX1...";
var keyVar   = Lookup("KeyStore", "KeyValue",  "KeyName", "myKey");
var ivVar    = Lookup("KeyStore", "IVValue",   "KeyName", "myKey");

/* ✅ ACCEPTED — key and IV come from variables, not literals */
var decrypted = Platform.Function.DecryptSymmetric(
    encryptedValue, "AES", "", keyVar, "", ivVar, ""
);

/* ❌ FAIL — key and IV are hardcoded string literals */
var badDecrypt = Platform.Function.DecryptSymmetric(
    encryptedValue, "AES", "", "my-secret-key", "", "my-secret-iv", ""
);
