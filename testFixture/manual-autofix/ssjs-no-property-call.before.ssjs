Platform.Load("Core", "1.1.5");

var method = Platform.Request.Method();
Platform.Response.ContentType("application/json");
Platform.Response.CharacterSet("UTF-8"), Platform.Response.Write("ok");
