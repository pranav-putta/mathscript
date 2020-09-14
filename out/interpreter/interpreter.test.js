"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var interpreter_1 = require("./interpreter");
var lexer_1 = require("./lexer");
var parser_1 = require("./parser");
function testArithmetic() {
    testInterpreter("10 * 3 * 4", 120);
    testInterpreter("20 / 3 / 4", 5 / 3);
    testInterpreter("1.6 * 3", 4.8);
    testInterpreter("67 * 8", 536);
    testInterpreter("34234 - 123123", -88889);
    testInterpreter("7 * 7 * 7", 343);
    testInterpreter("3.5 / 2", 1.75);
    testInterpreter("--+-3", -3);
}
function testInterpreter(input, expected) {
    var out = interpreter_1.interpretSource(input);
    console.log(input + " = " + out + ", expected: " + expected);
    // assert.strictEqual(out, expected);
}
var lexer = new lexer_1.Lexer("2 ^ 2");
var parser = new parser_1.Parser(lexer);
var tree = parser.parse();
console.log(tree.eval());
//# sourceMappingURL=interpreter.test.js.map