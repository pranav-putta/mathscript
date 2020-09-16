import { Expect, Test, TestCase } from "alsatian";
import { interpretSource } from "./interpreter";
import * as assert from "assert";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { util } from "./ast";

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

function testInterpreter(input: string, expected: any) {
  let out = interpretSource(input);
  console.log(input + " = " + out + ", expected: " + expected);
  // assert.strictEqual(out, expected);
}

let lexer = new Lexer("2 ^ 2");
let parser = new Parser(lexer);

let tree = parser.parse();
console.log(tree.eval());
