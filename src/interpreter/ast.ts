import { executeFunction, global_functions, global_scope } from "./global";
import {
  Computable,
  Numeric,
  UnevaluatedMatrix,
  isComputable,
  computeResult,
} from "./computable";
import { ParsingError, SymbolError, UndeclaredVariableError } from "./errors";
import { SymbolToken, Token, TokenType } from "./token";

/**
 * abstract syntax tree base class
 */
export abstract class AbstractSyntaxTree {
  /**
   * abstract evaluate method. visits all nodes in postorder traversal
   */
  abstract eval(): any;
}

/**
 * compound statements go here
 */
export class CompoundNode extends AbstractSyntaxTree {
  children: AST[];

  constructor(nodes: AST[] = []) {
    super();
    this.children = nodes;
  }

  eval() {
    let results = [];
    for (let child of this.children) {
      try {
        let val = child.eval();
        results.push(val);
      } catch (exception) {
        results.push(exception.message);
      }
    }
    return results;
  }
}

/**
 * assigns a variable to its value
 */
export class AssignNode extends AbstractSyntaxTree {
  private left: VariableNode;
  private right: AST;

  constructor(left: VariableNode, token: Token, right: AST) {
    super();
    this.left = left;
    this.right = right;
  }
  eval() {
    let name = this.left.value;
    let val = this.right.eval();
    global_scope[name] = val;
    return `${name} = ${global_scope[name]}`;
  }
}

/**
 * computes a procedure
 */
export class ProcedureNode extends AbstractSyntaxTree {
  private name: string;
  private args: AST[];

  constructor(token: SymbolToken, args: AST[]) {
    super();
    this.name = token.value;
    this.args = args;
  }

  eval() {
    let result = executeFunction(this.name, this.args)
    console.log(result);
    return result;
  }
}

/**
 * empty node, doesn't do anything
 */
export class EmptyNode extends AbstractSyntaxTree {
  eval() {
    return;
  }
}
/**
 * node that returns a computable value when evaluated
 */
export abstract class ComputableNode extends AbstractSyntaxTree {
  abstract eval(): Computable;
}

/**
 * binary operator node
 * takes a (left, operator, right)
 */
export class BinaryOperatorNode extends ComputableNode {
  /**
   * left node in binary operation
   */
  private left: AST;
  /**
   * right node in binary operation
   */
  private right: AST;
  /**
   * operator
   */
  private operator: Token;

  constructor(left: AST, operator: Token, right: AST) {
    super();
    this.left = left;
    this.right = right;
    this.operator = operator;
  }

  public eval(): Computable {
    let l = this.left.eval();
    let r = this.right.eval();

    if (isComputable(l) && isComputable(r)) {
      return computeResult(l, r, this.operator.type).result;
    }

    throw new ParsingError(
      `cannot operate on two non-computable values: ${l} and ${r}`
    );
  }
}

/**
 * holds a variable and its value
 */
export class VariableNode extends ComputableNode {
  private _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(token: SymbolToken) {
    super();
    this._value = token.value;
  }
  eval() {
    let name = this.value;
    let val = global_scope[name];
    if (val) {
      console.log(`${name} = ${val}`);
      return val;
    } else {
      throw new UndeclaredVariableError(`${name} was not declared!`);
    }
  }
}

/**
 * stores a single value: number or matrix
 */
export class SingleValueNode extends ComputableNode {
  private value: Computable | UnevaluatedMatrix;

  constructor(value: Computable | UnevaluatedMatrix) {
    super();
    this.value = value;
  }

  public eval(): Computable {
    // evaluate unevaluated matrix if not done already
    if (UnevaluatedMatrix.isUnevaluatedMatrix(this.value)) {
      this.value = this.value.evaluate();
    }

    return this.value;
  }
}

/**
 * holds a unary operator
 */
export class UnaryOperatorNode extends ComputableNode {
  private token: Token;
  private next: ComputableNode;

  constructor(token: Token, next: ComputableNode) {
    super();
    this.token = token;
    this.next = next;
  }

  public eval(): Computable {
    if (this.token.type == TokenType.plus) {
      return this.next.eval();
    } else if (this.token.type == TokenType.minus) {
      return this.next.eval().mul(new Numeric(-1)).result;
    } else {
      throw new SymbolError(
        "unexpected unary operator: " + this.token.type.toString()
      );
    }
  }
}

export function isComputableNode(node: AST): node is ComputableNode {
  return node instanceof ComputableNode;
}

export type AST = AbstractSyntaxTree;
export type CN = ComputableNode;
export type BinOp = BinaryOperatorNode;
export type SVN = SingleValueNode;
export type UnaryOp = UnaryOperatorNode;
