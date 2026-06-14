Platform.Load("Core", "1.1.5");

var obj = { a: 1, b: 2 };

for (var k in obj) {
    Write(k);
}
