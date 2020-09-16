import { SymbolError } from "./errors";
import { Token, TokenType, SymbolToken, newToken } from "./token";
import { isspace, isdigit, isalnum } from "./util";

interface Keywords {
  [key: string]: Token;
}

/**
 * Lexer tokenizes raw input into @class{Token} objects
 */
export class Lexer {
  public static readonly reserved_keywords: Keywords = {
    true: newToken(TokenType.primitive, "true"),
    false: newToken(TokenType.primitive, "false"),
  };
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

  private _id(): Token {
    let result = "";
    while (this.current_char && isalnum(this.current_char)) {
      result += this.current_char;
      let next = this.peek();
      if (next && isalnum(next)) {
        this.advance();
      } else {
        break;
      }
    }
    return (
      Lexer.reserved_keywords[result] || { type: TokenType.id, value: result }
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
   * retrieves next character without advancing position
   * @param steps number of steps to take
   */
  public peek(steps: number = 1): string | undefined {
    if (this.position + steps >= this.text.length) {
      return undefined;
    } else {
      return this.text.charAt(this.position + steps);
    }
  }

  /**
   * retrieves the next token by ignoring whitespaces
   */
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
      this.advance();
      // make sure next character is a digit, not an elipses or something like '1.'
      if (tmpNext && isdigit(tmpNext)) {
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
    // ignore all spaces
    if (this.current_char && isspace(this.current_char)) {
      this.ignore_whitespace();
    }

    // check if no more characters
    if (!this.current_char) {
      return { type: TokenType.eof, value: "eof" };
    }

    if (isdigit(this.current_char)) {
      // capture numeric token
      return { type: TokenType.num, value: this.tokenize_number() };
    } else if (isalnum(this.current_char)) {
      return this._id();
    } else if (this.current_char == "+") {
      return newToken(TokenType.plus);
    } else if (this.current_char == "-") {
      return newToken(TokenType.minus);
    } else if (this.current_char == "*") {
      return newToken(TokenType.mul);
    } else if (this.current_char == "/") {
      // check if token is rdiv
      let next = this.peek();
      if (next && next == "/") {
        this.advance();
        return newToken(TokenType.rdiv);
      }
      return newToken(TokenType.div);
    } else if (this.current_char == "(") {
      return newToken(TokenType.lparen);
    } else if (this.current_char == ")") {
      return newToken(TokenType.rparen);
    } else if (this.current_char == "[") {
      return newToken(TokenType.lbracket);
    } else if (this.current_char == "]") {
      return newToken(TokenType.rbracket);
    } else if (this.current_char == "<") {
      return newToken(TokenType.larrow);
    } else if (this.current_char == ">") {
      return newToken(TokenType.rarrow);
    } else if (this.current_char == ";") {
      return newToken(TokenType.semicolon);
    } else if (this.current_char == ",") {
      return newToken(TokenType.comma);
    } else if (this.current_char == "=" && this.peek() != "=") {
      return newToken(TokenType.assign);
    } else if (this.current_char == "." && this.peek() != ".") {
      return newToken(TokenType.dot);
    } else if (this.current_char == "\n") {
      return newToken(TokenType.endl);
    } else if (this.current_char == "^") {
      return newToken(TokenType.pow);
    } else if (this.current_char == "&") {
      // check if token is boolean and
      let next = this.peek();
      if (next && next == "&") {
        this.advance();
        return newToken(TokenType.and_bool);
      }
      return newToken(TokenType.and);
    } else if (this.current_char == "|") {
      // check if token is rdiv
      let next = this.peek();
      if (next && next == "|") {
        this.advance();
        return newToken(TokenType.or_bool);
      }
      return newToken(TokenType.or);
    }

    // token wasn't recognized
    throw new SymbolError("unexpected token: `" + this.current_char + "`");
  }
}
