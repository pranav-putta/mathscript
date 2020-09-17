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

    if (!this.current_char) {
      // check if no more characters
      return { type: TokenType.eof, value: "eof" };
    } else if (isdigit(this.current_char)) {
      // capture numeric token
      return { type: TokenType.num, value: this.tokenize_number() };
    } else if (isalnum(this.current_char)) {
      // capture alphanumeric token
      return this._id();
    } else {
      // look for each token
      for (let type in TokenType) {
        let tok: TokenType = TokenType[type as keyof typeof TokenType];
        // if this character type is more than one, peek next
        let char = this.current_char;
        let n = TokenType[type].length;
        for (let peekStep = 1; peekStep < n; peekStep++) {
          char += this.peek(peekStep);
        }
        // if type is strictly equal to char, match and return
        if (TokenType[type] == char) {
          for (let i = 1; i < n; i++) {
            this.advance();
          }
          return newToken(tok, type.toString());
        }
      }
    }

    // token wasn't recognized
    throw new SymbolError("unexpected token: `" + this.current_char + "`");
  }
}
