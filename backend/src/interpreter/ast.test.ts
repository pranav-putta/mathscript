import * as ast from "./ast";
import { Interpreter } from "./interpreter";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

let lexer = new Lexer("---33");
let parser = new Parser(lexer);
let interpreter = new Interpreter(parser);
interpreter.interpret();
