Platform.Load("Core", "1.1.5");

let label = "Guest";
var value = label ?? "Anonymous";

function payload() {
    return { label: label, value: value };
}
