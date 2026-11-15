/* Rule: sfmc/ssjs-require-platform-load
   Requires Platform.Load("core", "1") to be present in the file before
   any Core library objects (DataExtension, Subscriber, etc.) are used.
   Without the call the constructors fail at runtime.

   NOTE: The accepted version (Platform.Load placed before usage) is covered
   by require-platform-load-order.ssjs and by the ACCEPTED block in
   require-platform-load.html. This file only demonstrates the FAIL
   case — no Platform.Load anywhere in the file. */

/* FAIL - DataExtension.Init called with no Platform.Load anywhere in the file */
var de = DataExtension.Init("MyKey");
var rows = de.Rows.Retrieve();

/* FAIL - HTTP.Get and HTTP.Post called with no Platform.Load anywhere in the file */
var getResult = HTTP.Get("https://example.com/api");
var postResult = HTTP.Post("https://example.com/api", "application/json", "{}");
