"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretSource = exports.Interpreter = void 0;
var lexer_1 = require("./lexer");
var parser_1 = require("./parser");
var Interpreter = /** @class */ (function () {
    function Interpreter(parser) {
        this.parser = parser;
    }
    Interpreter.prototype.interpret = function () {
        var tree = this.parser.parse();
        return tree.eval();
    };
    return Interpreter;
}());
exports.Interpreter = Interpreter;
/**
 * interpret source code and output result
 * @param text raw input text
 */
function interpretSource(text) {
    var lexer = new lexer_1.Lexer(text);
    var parser = new parser_1.Parser(lexer);
    var interpreter = new Interpreter(parser);
    try {
        return interpreter.interpret();
    }
    catch (exception) {
        console.log(exception.message);
    }
}
exports.interpretSource = interpretSource;
//# sourceMappingURL=interpreter.js.map