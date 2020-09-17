import { AST } from "./ast";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

export class Interpreter {
  private parser: Parser;

  constructor(parser: Parser) {
    this.parser = parser;
  }

  public interpret(): any[] {
    let tree: AST = this.parser.parse();
    return tree.eval();
  }
}

/**
 * interpret source code and output result
 * @param text raw input text
 */
export function interpretSource(text: string): any[] | string {
  let lexer = new Lexer(text);
  let parser = new Parser(lexer);
  let interpreter = new Interpreter(parser);
  try {
    return interpreter.interpret();
  } catch (exception) {
    return exception.message;
  }
}
