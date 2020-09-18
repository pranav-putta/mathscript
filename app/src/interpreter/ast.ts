import {
  assignVariable,
  createUserDefinedFunction,
  executeFunction,
  findVariable,
} from "./global";
import {
  Computable,
  Numeric,
  UnevaluatedMatrix,
  isComputable,
  computeResult,
  isLogical,
  Logical,
} from "./computable";
import {
  ParsingError,
  RuntimeError,
  SymbolError,
  UndeclaredVariableError,
} from "./errors";
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
        if (val) {
          results.push(val);
        }
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
    let name = this.left.name;
    let val = this.right.eval();
    assignVariable(name, val, this.left.scope);
    return `${name} = ${val}`;
  }
}

/**
 * computes a procedure
 */
export class ProcedureCallNode extends AbstractSyntaxTree {
  private _name: string;
  private _args: AST[];

  public get args(): AST[] {
    return this._args;
  }

  public get name(): string {
    return this._name;
  }

  constructor(token: SymbolToken, args: AST[]) {
    super();
    this._name = token.value;
    this._args = args;
  }

  eval() {
    let result = executeFunction(this.name, this.args);
    return result;
  }
}

export class ProcedureDefinitionNode extends AbstractSyntaxTree {
  private _name: string;
  private _args: VariableNode[];
  private _exprs: AST[];

  constructor(name: string, args: VariableNode[], block: CompoundNode) {
    super();
    this._name = name;
    this._args = args;
    let newStatements = [];
    // make sure statements are not empty
    for (let arg of block.children) {
      if (!(arg instanceof EmptyNode)) {
        newStatements.push(arg);
      }
    }
    if (newStatements.length == 0) {
      throw new ParsingError(`no definition for function '${this.name}'`);
    }
    this._exprs = newStatements;
  }

  public get name() {
    return this._name;
  }

  public get args() {
    return this._args;
  }

  public get exprs() {
    return this._exprs;
  }

  eval(): string {
    createUserDefinedFunction(this);
    return `created function '${this.name}'`;
  }
}

/**
 * empty node, doesn't do anything
 */
export class EmptyNode extends AbstractSyntaxTree {
  eval() {
    return;
  }

  static isEmptyNode(el: AST): el is EmptyNode {
    return el instanceof EmptyNode;
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
    } else if (isComputable(l)) {
      throw new ParsingError(`${r} is not computable`);
    } else if (isComputable(r)) {
      throw new ParsingError(`${l} is not computable`);
    } else {
      throw new ParsingError(`${l} and ${r} are not computable`);
    }
  }
}

export class TernaryOperator extends ComputableNode {
  private boolExpr: ComputableNode;
  private trueExpr: ComputableNode;
  private falseExpr: ComputableNode;

  constructor(b: ComputableNode, t: ComputableNode, f: ComputableNode) {
    super();
    this.boolExpr = b;
    this.trueExpr = t;
    this.falseExpr = f;
  }

  eval(): Computable {
    let out = this.boolExpr.eval();
    if (isLogical(out)) {
      if (
        this.trueExpr instanceof EmptyNode ||
        this.falseExpr instanceof EmptyNode
      ) {
        throw new RuntimeError("ternary operator incomplete");
      }
      if (out.boolVal) {
        return this.trueExpr.eval();
      } else {
        return this.falseExpr.eval();
      }
    } else {
      throw new RuntimeError("ternary operator expects a boolean expression");
    }
  }
}

export enum VariableScope {
  global,
  procedure,
}
/**
 * holds a variable and its value
 */
export class VariableNode extends ComputableNode {
  private _name: string;
  private _scope: VariableScope;

  public get name(): string {
    return this._name;
  }

  public get scope(): VariableScope {
    return this._scope;
  }

  public set scope(newScope: VariableScope) {
    this._scope = newScope;
  }

  constructor(token: SymbolToken, scope: VariableScope) {
    super();
    this._name = token.value;
    this._scope = scope;
  }
  eval(): Computable {
    let name = this.name;
    let val = findVariable(name, this.scope);
    if (val) {
      console.log(`${name} = ${val}`);
      return val;
    } else {
      throw new UndeclaredVariableError(`${name} was not declared!`);
    }
  }

  /**
   * check if an array of nodes is a list of variables
   * @param arr list of tree nodes
   */
  static isVariableArray(arr: AST[]): arr is VariableNode[] {
    for (let arg of arr) {
      if (!(arg instanceof VariableNode)) {
        return false;
      }
    }
    return true;
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
    } else if (this.token.type == TokenType.not) {
      let n = this.next.eval();
      if (isLogical(n)) {
        return new Logical(!n.value);
      } else {
        throw new RuntimeError("unary not expects boolean");
      }
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
