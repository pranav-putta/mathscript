"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var interpreter_1 = require("./interpreter");
var lexer_1 = require("./lexer");
var parser_1 = require("./parser");
var lexer = new lexer_1.Lexer("---33");
var parser = new parser_1.Parser(lexer);
var interpreter = new interpreter_1.Interpreter(parser);
interpreter.interpret();
//# sourceMappingURL=ast.test.js.map