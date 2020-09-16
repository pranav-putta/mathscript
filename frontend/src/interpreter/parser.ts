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
import { Matrix, AComputable } from "./computable";
import { MatrixError, ParsingError, SymbolError, SyntaxError } from "./errors";
import { Lexer } from "./lexer";
import {
  TokenType,
  Token,
  isNumericToken,
  plus_token,
  eof_token,
  isSymbolToken,
} from "./token";

export class Parser {
  private lexer: Lexer;
  private current_token: Token;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.current_token = this.lexer.next_token();
  }

  /**
   * identify expression
   * expr   : term ((PLUS | MINUS) term)* | term ((PLUS | MINUS)term)*
   * term   : factor ((MUL | DIV | POW) factor)*
   * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix | variable | procedure
   * matrix :  lbracket (row)* rbracket
   */
  private expr(ignoreWhiteSpace: boolean = true): AST {
    // first node
    let node: AST = this.term();

    // do this until a new ((PLUS | MINUS) term) cannot be found
    while (
      this.current_token.type == TokenType.plus ||
      this.current_token.type == TokenType.minus
    ) {
      // check white spaces,
      // if next character is empty or previous character is empty, binary operate
      if (
        ignoreWhiteSpace ||
        this.lexer.peek(1) == " " ||
        this.lexer.peek(-1) != " "
      ) {
        // capture operator (PLUS | MINUS)
        let token = this.current_token;
        if (token.type == TokenType.plus) {
          this.eat(TokenType.plus);
        } else if (token.type == TokenType.minus) {
          this.eat(TokenType.minus);
        }
        // build abstract syntax tree
        node = new BinaryOperatorNode(node, token, this.term());
      } else {
        return node;
      }
    }

    return node;
  }

  /**
   * identify term
   * term   : factor ((MUL | DIV) factor)*
   * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix
   * matrix :  lbracket (row)* rbracket
   * @return node
   */
  private term(): AST {
    // left factor
    let node: AST = this.powers();
    // do this until a new ((POW | MUL | DIV | RDIV) factor) cannot be found
    while (
      this.current_token.type == TokenType.mul ||
      this.current_token.type == TokenType.div ||
      this.current_token.type == TokenType.rdiv
    ) {
      // capture next operator (MUL | DIV)
      let token = this.current_token;
      if (token.type == TokenType.mul) {
        this.eat(TokenType.mul);
      } else if (token.type == TokenType.div) {
        this.eat(TokenType.div);
      } else if (token.type == TokenType.rdiv) {
        this.eat(TokenType.rdiv);
      }
      // build abstract syntax tree
      node = new BinaryOperatorNode(node, token, this.powers());
    }

    return node;
  }

  private powers(): AST {
    // left factor
    let node: AST = this.factor();
    while (this.current_token.type == TokenType.pow) {
      let token = this.current_token;
      if (token.type == TokenType.pow) {
        this.eat(TokenType.pow);
      }
      node = new BinaryOperatorNode(node, token, this.factor());
    }
    return node;
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
      return new SingleValueNode(token.value);
    } else if (token.type == TokenType.lparen) {
      // lparen expr rparen
      this.eat(TokenType.lparen);
      let node: AST = this.expr();
      this.eat(TokenType.rparen);
      return node;
    } else if (token.type == TokenType.lbracket) {
      // matrix
      let matrix: Matrix = this.matrix();
      return new SingleValueNode(matrix);
    } else if (token.type == TokenType.larrow) {
      let vector: Matrix = this.vector();
      return new SingleValueNode(vector);
    } else if (token.type == TokenType.id) {
      let next = this.lexer.peek();
      if (next && next == "(") {
        return this.procedure();
      } else {
        return this.variable();
      }
    }

    throw new SyntaxError("unexpected symbol");
  }

  private vector(): Matrix {
    // check left arrow
    this.eat(TokenType.larrow);
    // get one row
    let row = this.matrix_row(TokenType.rarrow);
    // check right arrow
    this.eat(TokenType.rarrow);
    return new Matrix([row]);
  }

  /**
   * matrix :  lbracket (row ;)* (row ]) rbracket
   */
  private matrix(): Matrix {
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
    return new Matrix(arr);
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
  public variable(): VariableNode {
    if (isSymbolToken(this.current_token)) {
      let node = new VariableNode(this.current_token);
      this.eat(TokenType.id);
      return node;
    }
    throw new SymbolError("couldn't parse variable name");
  }

  /**
   * assignment : (variable = expr) (,variable = expr)*
   */
  public assignment(): AssignNode[] {
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
  public procedure(): ProcedureNode {
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

  /**
   * assignment | procedure | expr
   */
  public variable_statement(): AST[] {
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

    throw new ParsingError("couldn't find a variable!");
  }

  /**
   * statement : compound_statement | assignment_statment | expression_statement | empty
   */
  public statement(): AST[] {
    if (this.current_token.type == TokenType.id) {
      return this.variable_statement();
    } else {
      return [this.expr(true)];
    }
  }

  /**
   * statement_list : statement | statement endl statement_list
   */
  public statement_list(): AST[] {
    let results = this.statement();
    while (this.current_token.type == TokenType.endl) {
      while (this.current_token.type == TokenType.endl) {
        this.eat(TokenType.endl);
      }

      if (this.current_token.type != TokenType.eof) {
        results = results.concat(this.statement());
      }
    }

    if (this.current_token.type == TokenType.id) {
      throw new SyntaxError("unexpected identifier");
    }

    return results;
  }

  /**
   * compound: statement_list
   */
  public compound(): AST {
    let nodes = this.statement_list();

    let node = new CompoundNode();
    for (let n of nodes) {
      node._children.push(n);
    }

    return node;
  }

  public program(): AST {
    let node = this.compound();
    this.eat(TokenType.eof);
    return node;
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
}
