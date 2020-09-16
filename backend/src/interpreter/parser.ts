import {
  AssignNode,
  AST,
  BinaryOperatorNode,
  CompoundNode,
  ComputableNode,
  isComputableNode,
  SingleValueNode,
  UnaryOperatorNode,
  VariableNode,
  ProcedureNode,
} from "./ast";
import { Numeric, Logical, UnevaluatedMatrix } from "./computable";
import { MatrixError, ParsingError, SymbolError, SyntaxError } from "./errors";
import { Lexer } from "./lexer";
import { TokenType, Token, isNumericToken, isSymbolToken } from "./token";

export class Parser {
  private lexer: Lexer;
  private current_token: Token;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.current_token = this.lexer.next_token();
  }

  /**
   * parse tokens into an abstract syntax tree for traversal
   */
  public parse(): AST {
    let node = this.program();
    if (this.current_token.type != TokenType.eof) {
      throw new SyntaxError("parsing didn't go as expected!");
    }
    return node;
  }

  /**
   * identify expression
   * expr   : term ((PLUS | MINUS) term)* | term ((PLUS | MINUS)term)*
   * term   : powers ((MUL | DIV ) powers)*
   * powers : factor ((POW) factor)*
   * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix | variable | procedure | (TRUE | FALSE)
   * matrix :  lbracket (row)* rbracket
   */
  private expr(ignoreWhiteSpace: boolean = true): AST {
    let powers = this.binop(this.factor, [TokenType.pow]);
    let mul_div = this.binop(powers, [TokenType.mul, TokenType.div]);
    let add_plus = this.binop(
      mul_div,
      [TokenType.plus, TokenType.minus],
      ignoreWhiteSpace
    );
    let and = this.binop(add_plus, [TokenType.and_bool]);
    let or = this.binop(and, [TokenType.or_bool]);
    return or();
  }

  private bool(): AST {
    let token = this.current_token;
    if (token.type == TokenType.id) {
      if (token.value === Lexer.reserved_keywords["true"].value) {
        return new SingleValueNode(new Logical(true));
      } else if (token.value === Lexer.reserved_keywords["false"].value) {
        return new SingleValueNode(new Logical(true));
      }
    }
    throw new ParsingError("unexpected symbol: " + token.value);
  }

  /**
   * create a binary operation function
   * @param func function to process
   * @param operators operators to check for
   * @param ignoreWhiteSpace check for whitespace pattern " + 1" => plus, " +1" => unary positive
   */
  private binop(
    func: () => AST,
    operators: TokenType[],
    ignoreWhiteSpace: boolean = true
  ): () => AST {
    // create a callable function
    let call = (): AST => {
      // left node
      let node: AST = func();
      let token: Token = this.current_token;
      while (operators.includes(token.type)) {
        if (
          ignoreWhiteSpace ||
          this.lexer.peek(1) == " " ||
          this.lexer.peek(-1) != " "
        ) {
          this.eat(token.type);
          node = new BinaryOperatorNode(node, token, func());
        } else {
          return node;
        }
      }
      return node;
    };
    return call;
  }

  /**
   * identify factor
   * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix
   * matrix :  lbracket (row)* rbracket
   * @return abstract syntax node
   */
  private factor(): AST {
    let token = this.current_token;
    if (token.type == TokenType.plus) {
      // positive sign
      this.eat(TokenType.plus);
      return new UnaryOperatorNode(token, this.factor());
    } else if (token.type == TokenType.minus) {
      // negation sign
      this.eat(TokenType.minus);
      return new UnaryOperatorNode(token, this.factor());
    } else if (isNumericToken(token)) {
      // token is a number
      this.eat(TokenType.num);
      return new SingleValueNode(new Numeric(token.value));
    } else if (token.type == TokenType.lparen) {
      // lparen expr rparen
      this.eat(TokenType.lparen);
      let node: AST = this.expr();
      this.eat(TokenType.rparen);
      return node;
    } else if (token.type == TokenType.lbracket) {
      // matrix
      let matrix: UnevaluatedMatrix = this.matrix();
      return new SingleValueNode(matrix);
    } else if (token.type == TokenType.larrow) {
      // vector (meaning single row matrix)
      let vector: UnevaluatedMatrix = this.vector();
      return new SingleValueNode(vector);
    } else if (token.type == TokenType.id) {
      // identifier
      let next = this.lexer.peek();
      if (next && next == "(") {
        // procedure
        return this.procedure();
      } else {
        // variable identifier
        return this.variable();
      }
    } else {
      return this.bool();
    }

    throw new SyntaxError("unexpected symbol");
  }

  /**
   * vector : single row matrix
   */
  private vector(): UnevaluatedMatrix {
    // check left arrow
    this.eat(TokenType.larrow);
    // get one row
    let row = this.matrix_row(TokenType.rarrow);
    // check right arrow
    this.eat(TokenType.rarrow);
    return new UnevaluatedMatrix([row]);
  }

  /**
   * matrix :  lbracket (row ;)* (row ]) rbracket
   */
  private matrix(): UnevaluatedMatrix {
    let arr: ComputableNode[][] = new Array();
    // check left bracket
    this.eat(TokenType.lbracket, "parsing matrix: ");
    // loop through rows
    while (this.current_token.type != TokenType.rbracket) {
      let row = this.matrix_row(TokenType.rbracket);
      arr.push(row);
      if (this.current_token.type == TokenType.semicolon) {
        this.eat(TokenType.semicolon, "parsing matrix row: ");
      }
    }
    // check right bracket
    this.eat(TokenType.rbracket, "parsing matrix: ");
    return new UnevaluatedMatrix(arr);
  }

  /**
   * row : (factor,)*
   */
  private matrix_row(endToken: TokenType): ComputableNode[] {
    let arr: ComputableNode[] = new Array();

    while (true) {
      let val = this.expr(false);
      // make sure the element is computable
      if (isComputableNode(val)) {
        // everything else is good, push element into row
        arr.push(val);
        // if row hasn't reached end, consume 'comma' separator
        if (
          this.current_token.type != TokenType.semicolon &&
          this.current_token.type != endToken
        ) {
          if (this.current_token.type == TokenType.comma) {
            this.eat(TokenType.comma, "parsing matrix row: ");
          }
        } else {
          break;
        }
      } else {
        throw new MatrixError(
          "matrix parsing error: expected a numeric element"
        );
      }
    }

    return arr;
  }

  /**
   * consume token and advance to next token
   * @param type token type to verify
   */
  private eat(type: TokenType, message?: string) {
    if (this.current_token.type == type) {
      // if expected token type and current token type matches, proceed to next token
      this.current_token = this.lexer.next_token();
    } else {
      // if token type does not match, a syntax error has happened
      throw new SyntaxError(
        message ||
          "" +
            "expected " +
            type.toString() +
            ", but got " +
            this.current_token.type.toString()
      );
    }
  }

  /**
   * variable : id
   */
  private variable(): VariableNode {
    if (isSymbolToken(this.current_token)) {
      let node = new VariableNode(this.current_token);
      this.eat(TokenType.id);
      return node;
    }
    throw new SymbolError("couldn't parse variable name");
  }

  /**
   * program : compound eof
   */
  private program(): AST {
    let node = this.compound();
    this.eat(TokenType.eof);
    return node;
  }

  /**
   * compound: statement_list
   */
  private compound(): AST {
    return new CompoundNode(this.statement_list());
  }

  /**
   * statement_list : statement | statement endl statement_list
   */
  private statement_list(): AST[] {
    let results = this.statement();
    while (this.current_token.type == TokenType.endl) {
      // ignore all end lines
      while (this.current_token.type == TokenType.endl) {
        this.eat(TokenType.endl);
      }
      results = results.concat(this.statement());
    }

    if (this.current_token.type == TokenType.id) {
      throw new SyntaxError("unexpected identifier");
    }

    return results;
  }

  /**
   * statement : id_statement | expr
   */
  private statement(): AST[] {
    if (this.current_token.type == TokenType.id) {
      return this.id_statement();
    } else if (this.current_token.type != TokenType.eof) {
      return [this.expr(true)];
    } else {
      return [];
    }
  }
  /**
   * id_statement : assignemnt | procedure | expr
   */
  private id_statement(): AST[] {
    let token = this.current_token;
    if (token.type == TokenType.id) {
      if (this.lexer.peekToken() == "=") {
        return this.assignment();
      } else if (this.lexer.peekToken() == "(") {
        return [this.procedure()];
      } else {
        return [this.expr()];
      }
    }

    throw new ParsingError("couldn't find an identifier!");
  }

  /**
   * assignment : (variable = expr) (,variable = expr)*
   */
  private assignment(): AssignNode[] {
    let left = this.variable();
    let token = this.current_token;
    this.eat(TokenType.assign, "parsing assignment: ");
    let right = this.expr();
    let assignments = [new AssignNode(left, token, right)];
    //  check if multiline assignment
    if (this.current_token.type == TokenType.comma) {
      this.eat(TokenType.comma);
      let next = this.assignment();
      assignments = assignments.concat(next);
    }
    return assignments;
  }

  /**
   * procedure : id lparen (expr,)* rparen
   */
  private procedure(): ProcedureNode {
    let token = this.current_token;
    if (!isSymbolToken(token)) {
      throw new SymbolError("expected an identifier symbol but didn't get it!");
    }
    this.eat(TokenType.id);
    this.eat(TokenType.lparen);
    let args = [];
    while (true) {
      args.push(this.expr());
      if (this.current_token.type == TokenType.comma) {
        this.eat(TokenType.comma);
      } else {
        break;
      }
    }
    this.eat(TokenType.rparen);
    return new ProcedureNode(token, args);
  }
}
