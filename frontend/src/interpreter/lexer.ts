import { SymbolError } from "./errors";
import {
  Token,
  TokenType,
  plus_token,
  minus_token,
  mul_token,
  div_token,
  lparen_token,
  rparen_token,
  lbracket_token,
  rbracket_token,
  semicolon_token,
  comma_token,
  bar_token,
  assign_token,
  dot_token,
  endl_token,
  SymbolToken,
  rdiv_token,
  larrow_token,
  rarrow_token,
  pow_token,
} from "./token";
import { isspace, isdigit, isalnum } from "./util";

interface Keywords {
  [key: string]: SymbolToken;
}

/**
 * Lexer tokenizes raw input into @class{Token} objects
 */
export class Lexer {
  private readonly reserved_keywords: Keywords = {};
  /**
   * raw input text
   */
  private text: string;
  /**
   * current tokenizing position
   */
  private position: number;
  /**
   * current character at position
   */
  private current_char: string | undefined;

  constructor(text: string) {
    this.text = text;
    this.position = -1;
  }

  private _id(): SymbolToken {
    let result = "";
    while (this.current_char && isalnum(this.current_char)) {
      result += this.current_char;
      let next = this.peek();
      if (next && isalnum(next)) {
        this.advance();
      } else {
        break;
      }
      /**
      // allow spaces in identifier names
      if (this.current_char && isspace(this.current_char)) {
        // ignore whitespace until next token
        this.ignore_whitespace(false);
        // check if next token is also alphanumeric
        let next = this.peek();
        if (next && isalnum(next)) {
          // if true, set next token
          this.advance()
        }
      }*/
    }
    return (
      this.reserved_keywords[result] || { type: TokenType.id, value: result }
    );
  }

  /**
   * increments position and updates current_char
   * sets current_char to undefined if position is out of bounds
   */
  private advance() {
    this.position++;

    if (this.position < this.text.length) {
      this.current_char = this.text.charAt(this.position);
    } else {
      this.current_char = undefined;
    }
  }

  /**
   * retrieves next token without advancing position
   */
  public peek(steps: number = 1): string | undefined {
    if (this.position + steps >= this.text.length) {
      return undefined;
    } else {
      return this.text.charAt(this.position + steps);
    }
  }

  public peekToken(): string {
    let pos = this.position + 1;
    while (pos < this.text.length && isspace(this.text.charAt(pos))) {
      pos += 1;
    }
    return this.text.charAt(pos);
  }

  /**
   * skips all whitepsace in sequence
   */
  private ignore_whitespace(advance: boolean = true) {
    if (advance) {
      // stop at next token
      while (this.current_char && isspace(this.current_char)) {
        this.advance();
      }
    } else {
      // stop before next token
      let current = this.peek();
      while (current && isspace(current)) {
        this.advance();
      }
    }
  }

  /**
   * converts numeric character sequence into a token
   */
  private tokenize_number(): number {
    let result = this.current_char || "";
    let next = this.peek();
    // capture integer
    while (next && isdigit(next)) {
      this.advance();
      result += this.current_char;
      next = this.peek();
    }

    // check if decimal point
    if (next && next == ".") {
      let tmpNext = this.peek(2);
      // make sure next character is a digit, not an elipses or something like '1.'
      if (tmpNext && isdigit(tmpNext)) {
        this.advance();
        result += this.current_char;
        next = this.peek();

        // append numbers after decimal point
        while (next && isdigit(next)) {
          this.advance();
          result += this.current_char;
          next = this.peek();
        }
      }
    }

    // convert to number and return
    return Number(result);
  }

  /**
   * retrieves next token in string
   */
  public next_token(): Token {
    this.advance();
    let token = this.tokenize();
    return token;
  }

  /**
   * compares characters and matches with associated token
   */
  private tokenize(): Token {
    if (!this.current_char) {
      // no more characters
      return { type: TokenType.eof, value: "eof" };
    }
    if (isspace(this.current_char)) {
      // ignore all spaces
      this.ignore_whitespace();
    }

    if (isdigit(this.current_char)) {
      // capture numeric token
      return { type: TokenType.num, value: this.tokenize_number() };
    } else if (isalnum(this.current_char)) {
      return this._id();
    } else if (this.current_char == "+") {
      // capture "plus" token
      return plus_token;
    } else if (this.current_char == "-") {
      // capture "minus" token
      return minus_token;
    } else if (this.current_char == "*") {
      // capture "mul" token
      return mul_token;
    } else if (this.current_char == "/") {
      let next = this.peek();
      if (next && next == "/") {
        this.advance();
        return rdiv_token;
      }
      // capture "div" token
      return div_token;
    } else if (this.current_char == "(") {
      // capture "lparen" token
      return lparen_token;
    } else if (this.current_char == ")") {
      // capture "rparen" token
      return rparen_token;
    } else if (this.current_char == "[") {
      // capture "lbracket" token
      return lbracket_token;
    } else if (this.current_char == "]") {
      // capture "rbracket" token
      return rbracket_token;
    } else if (this.current_char == "<") {
      // capture "lbracket" token
      return larrow_token;
    } else if (this.current_char == ">") {
      // capture "rbracket" token
      return rarrow_token;
    } else if (this.current_char == ";") {
      // capture "semicolon" token
      return semicolon_token;
    } else if (this.current_char == ",") {
      // capture "comma" token
      return comma_token;
    } else if (this.current_char == "|") {
      // capture "bar" token
      return bar_token;
    } else if (this.current_char == "=" && this.peek() != "=") {
      // capture "assign" token
      return assign_token;
    } else if (this.current_char == "." && this.peek() != ".") {
      // capture "dot" token
      return dot_token;
    } else if (this.current_char == "\n") {
      // capture "endl" token
      return endl_token;
    } else if (this.current_char == "^") {
      // capture "^"
      return pow_token;
    }

    // token wasn't recognized
    throw new SymbolError("unexpected token: `" + this.current_char + "`");
  }
}
