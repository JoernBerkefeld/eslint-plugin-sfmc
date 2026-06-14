Platform.Load("Core", "1.1.5");

var label = "Guest";
var value = label || "Anonymous";

function payload() {
    var _result = { label: label, value: value };
    return _result;
}
