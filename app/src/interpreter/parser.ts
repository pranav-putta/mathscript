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
  ProcedureCallNode,
  VariableScope,
  ProcedureDefinitionNode,
  EmptyNode,
  TernaryOperator,
} from "./ast";
import { Numeric, Logical, UnevaluatedMatrix } from "./computable";
import { MatrixError, ParsingError, SymbolError, SyntaxError } from "./errors";
import { Lexer } from "./lexer";
import { TokenType, Token, isNumericToken, isSymbolToken } from "./token";

interface Operation {
  tokens: TokenType[];
  igws: boolean;
  scope: VariableScope;
}
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
  private expr(ignoreWhiteSpace: boolean, scope: VariableScope): AST {
    let opsOrder: Operation[] = [
      {
        tokens: [TokenType.pow],
        igws: ignoreWhiteSpace,
        scope: scope,
      },
      {
        tokens: [TokenType.modulo],
        igws: ignoreWhiteSpace,
        scope: scope,
      },
      {
        tokens: [TokenType.mul, TokenType.div, TokenType.rdiv],
        igws: true,
        scope: scope,
      },
      {
        tokens: [TokenType.plus, TokenType.minus],
        igws: ignoreWhiteSpace,
        scope: scope,
      },
      {
        tokens: [TokenType.and, TokenType.or],
        igws: ignoreWhiteSpace,
        scope: scope,
      },
      {
        tokens: [
          TokenType.larrow,
          TokenType.rarrow,
          TokenType.eq,
          TokenType.not_bool,
          TokenType.less_eq,
          TokenType.more_eq,
        ],
        igws: ignoreWhiteSpace,
        scope: scope,
      },
      { tokens: [TokenType.and_bool], igws: true, scope: scope },
      { tokens: [TokenType.or_bool], igws: true, scope: scope },
    ];
    let func = this.factor;
    for (let op of opsOrder) {
      func = this.binops(func, op.tokens, op.igws);
    }
    let expr = func.call(this, scope);

    // if ? ternary operation, otherwise return
    if (this.current_token.type == TokenType.ternary) {
      this.eat(TokenType.ternary);
      let t = this.expr(ignoreWhiteSpace, scope);
      this.eat(TokenType.colon);
      let f = this.expr(ignoreWhiteSpace, scope);
      return new TernaryOperator(expr, t, f);
    }
    return expr;
  }

  /**
   *
   * @param func
   * @param operators
   * @param ignoreWhiteSpace
   */
  private binops(
    func: (scope: VariableScope) => AST,
    operators: TokenType[],
    ignoreWhiteSpace: boolean = true
  ) {
    return (scope: VariableScope): AST => {
      // left node
      let node: AST = func.call(this, scope);
      let token: Token = this.current_token;
      while (operators.includes(token.type)) {
        if (
          ignoreWhiteSpace ||
          this.lexer.peek(1) == " " ||
          this.lexer.peek(-1) != " "
        ) {
          this.eat(token.type);
          node = new BinaryOperatorNode(node, token, func.call(this, scope));
          token = this.current_token;
        } else {
          return node;
        }
      }
      return node;
    };
  }

  /**
   * identify factor
   * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix
   * matrix :  lbracket (row)* rbracket
   * @return abstract syntax node
   */
  private factor(scope: VariableScope): AST {
    let token = this.current_token;
    if (token.type == TokenType.plus) {
      // positive sign
      this.eat(TokenType.plus);
      return new UnaryOperatorNode(token, this.factor(scope));
    } else if (token.type == TokenType.minus) {
      // negation sign
      this.eat(TokenType.minus);
      return new UnaryOperatorNode(token, this.factor(scope));
    } else if (token.type == TokenType.not) {
      this.eat(TokenType.not);
      return new UnaryOperatorNode(token, this.factor(scope));
    } else if (isNumericToken(token)) {
      // token is a number
      this.eat(TokenType.num);
      return new SingleValueNode(new Numeric(token.value));
    } else if (token.type == TokenType.lparen) {
      // lparen expr rparen
      this.eat(TokenType.lparen);
      let node: AST = this.expr(true, scope);
      this.eat(TokenType.rparen);
      return node;
    } else if (token.type == TokenType.lbracket) {
      // matrix
      return new SingleValueNode(this.matrix());
    } else if (token.type == TokenType.larrow) {
      // vector (meaning single row matrix)
      return new SingleValueNode(this.vector());
    } else if (token.type == TokenType.primitive) {
      return this.primitive();
    } else if (token.type == TokenType.id) {
      // identifier
      let next = this.lexer.peekToken();
      if (next.type == TokenType.lparen) {
        // look for procedure
        let proc = this.procedure(scope);
        // check if defining a procedure or calling it
        let next: Token = this.current_token;
        if (next.type == TokenType.assign || next.type == TokenType.define) {
          return this.procedure_definition(proc, scope);
        } else {
          return proc;
        }
      } else {
        // variable identifier
        return this.variable(scope);
      }
    }

    return new EmptyNode();
  }

  /**
   * a primitive alphanumeric type like boolean
   */
  private primitive(): AST {
    let token = this.current_token;
    if (token.type == TokenType.primitive) {
      if (token.value === Lexer.reserved_keywords["true"].value) {
        this.eat(TokenType.primitive);
        return new SingleValueNode(new Logical(true));
      } else if (token.value === Lexer.reserved_keywords["false"].value) {
        this.eat(TokenType.primitive);
        return new SingleValueNode(new Logical(false));
      }
    }
    throw new ParsingError("unexpected symbol: " + token.value);
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
      let val = this.expr(false, VariableScope.global);
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
  private variable(scope: VariableScope = VariableScope.global): VariableNode {
    if (isSymbolToken(this.current_token)) {
      let node = new VariableNode(this.current_token, scope);
      this.eat(TokenType.id);
      return node;
    }
    throw new SymbolError("couldn't parse variable name");
  }

  /**
   * program : compound eof
   */
  private program(): AST {
    let node = this.compound(VariableScope.global);
    this.eat(TokenType.eof);
    return node;
  }

  /**
   * compound: statement_list
   */
  private compound(scope: VariableScope): CompoundNode {
    return new CompoundNode(this.statement_list(scope));
  }

  private ignoreNewLines() {
    // ignore all end lines
    while (this.current_token.type === TokenType.endl) {
      this.eat(TokenType.endl);
    }
  }

  /**
   * statement_list : statement | statement endl statement_list
   */
  private statement_list(scope: VariableScope): AST[] {
    this.ignoreNewLines();
    let results = this.statement(scope);
    while (this.current_token.type == TokenType.endl) {
      this.ignoreNewLines();
      results = results.concat(this.statement(scope));
    }

    if (this.current_token.type == TokenType.id) {
      throw new SyntaxError("unexpected identifier");
    }

    return results;
  }

  /**
   * statement : id_statement | expr
   */
  private statement(scope: VariableScope = VariableScope.global): AST[] {
    if (this.current_token.type == TokenType.id) {
      return this.id_statement(scope);
    } else if (this.current_token.type == TokenType.reserved) {
      return this.reserved_statement();
    } else if (this.current_token.type != TokenType.eof) {
      return [this.expr(true, scope)];
    } else {
      return [];
    }
  }

  private reserved_statement(): AST[] {
    let token = this.current_token;
    throw new ParsingError("unexpected reserve word");
  }

  /**
   * create a user defined procedure
   * @param proc
   */
  private procedure_definition(
    proc: ProcedureCallNode,
    currentScope: VariableScope
  ): ProcedureDefinitionNode {
    if (currentScope == VariableScope.procedure) {
      throw new ParsingError("nested functions aren't supported!");
    }
    this.eat(this.current_token.type);
    // make sure all of the parameters are variables
    let args = proc.args;
    if (VariableNode.isVariableArray(args)) {
      // change scope of variables
      for (let arg of args) {
        arg.scope = VariableScope.procedure;
      }
      // load expressions
      if (this.current_token.type == TokenType.lbrace) {
        // multi line statements
        this.eat(TokenType.lbrace);
        // @ts-ignore ignore the stupid if check since current_token changes in this.eat()

        let exprs = this.compound(VariableScope.procedure);
        this.eat(TokenType.rbrace);
        return new ProcedureDefinitionNode(proc.name, args, exprs);
      } else {
        // single line expression
        let expr = this.expr(true, VariableScope.procedure);
        return new ProcedureDefinitionNode(
          proc.name,
          args,
          new CompoundNode([expr])
        );
      }
    } else {
      throw new ParsingError(
        "cannot define a function with non-variable parameters"
      );
    }
  }

  /**
   * id_statement : assignemnt | procedure | expr
   */
  private id_statement(scope: VariableScope): AST[] {
    let token = this.current_token;
    if (token.type == TokenType.id) {
      if (this.lexer.peekToken().type == TokenType.assign) {
        return this.assignment(scope);
      } else {
        return [this.expr(true, scope)];
      }
    }

    throw new ParsingError("couldn't find an identifier!");
  }

  /**
   * assignment : (variable = expr) (,variable = expr)*
   */
  private assignment(scope: VariableScope): AssignNode[] {
    let left = this.variable(scope);
    let token = this.current_token;
    this.eat(TokenType.assign, "parsing assignment: ");
    let right = this.expr(true, scope);
    let assignments = [new AssignNode(left, token, right)];
    //  check if multiline assignment
    if (this.current_token.type == TokenType.comma) {
      this.eat(TokenType.comma);
      let next = this.assignment(scope);
      assignments = assignments.concat(next);
    }
    return assignments;
  }

  /**
   * procedure : id lparen (expr,)* rparen
   */
  private procedure(scope: VariableScope): ProcedureCallNode {
    let token = this.current_token;
    if (!isSymbolToken(token)) {
      throw new SymbolError("expected an identifier symbol but didn't get it!");
    }
    this.eat(TokenType.id);
    this.eat(TokenType.lparen);
    let args = [];
    while (this.current_token.type != TokenType.rparen) {
      args.push(this.expr(true, scope));
      if (this.current_token.type == TokenType.comma) {
        this.eat(TokenType.comma);
      } else {
        break;
      }
    }
    this.eat(TokenType.rparen);
    return new ProcedureCallNode(token, args);
  }
}
