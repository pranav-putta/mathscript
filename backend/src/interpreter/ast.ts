import { global_functions, global_scope } from "./global";
import { AComputable, Computable, Result } from "./computable";
import {
  ArithmeticError,
  MatrixError,
  SymbolError,
  UndeclaredVariableError,
} from "./errors";
import { plus_token, SymbolToken, Token, TokenType } from "./token";
import { Queue } from "./util";

/**
 * abstract syntax tree base class
 */
export abstract class AbstractSyntaxTree {
  /**
   * abstract evaluate method. visits all nodes in postorder traversal
   */
  abstract eval(): any;
  /**
   * list of children
   * @dev
   */
  abstract get _children(): AbstractSyntaxTree[];

  /**
   * inherent value of node as a string
   * @dev
   */
  abstract get _node_value_string(): string;
}

/**
 * compound statements go here
 */
export class CompoundNode extends AbstractSyntaxTree {
  private children: AST[];

  constructor() {
    super();
    this.children = [];
  }

  eval() {
    let results = [];
    for (let child of this.children) {
      let val = child.eval();
      results.push(val);
    }
  }
  get _children(): AbstractSyntaxTree[] {
    return this.children;
  }
  get _node_value_string(): string {
    return "compound";
  }
}

/**
 * assigns a variable to its value
 */
export class AssignNode extends AbstractSyntaxTree {
  private left: VariableNode;
  private token: Token;
  private right: AST;

  constructor(left: VariableNode, token: Token, right: AST) {
    super();
    this.left = left;
    this.token = token;
    this.right = right;
  }
  eval() {
    let name = this.left.value;
    global_scope[name] = this.right.eval();
    console.log(`${name} = ${global_scope[name]}`);
  }
  get _children(): AbstractSyntaxTree[] {
    return [this.left, this.right];
  }
  get _node_value_string(): string {
    return "=";
  }
}

/**
 * computes a procedure
 */
export class ProcedureNode extends AbstractSyntaxTree {
  private token: Token;
  private name: string;
  private args: AST[];

  constructor(token: SymbolToken, args: AST[]) {
    super();
    this.token = token;
    this.name = token.value;
    this.args = args;
  }

  eval() {
    let func = global_functions[this.name];
    let result = func.apply(this, this.args);
    console.log(result);
    return result;
  }
  get _children(): AbstractSyntaxTree[] {
    throw new Error("Method not implemented.");
  }
  get _node_value_string(): string {
    throw new Error("Method not implemented.");
  }
}

/**
 * empty node, doesn't do anything
 */
export class EmptyNode extends AbstractSyntaxTree {
  eval() {
    return;
  }
  get _children(): AbstractSyntaxTree[] {
    return [];
  }
  get _node_value_string(): string {
    return "empty node";
  }
}

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

  // TODO: simplify commutative process
  public eval(): any {
    let l = this.left.eval();
    let r = this.right.eval();
    let result: Result | undefined;

    if (AComputable.isComputable(l) && AComputable.isComputable(r)) {
      if (this.operator.type == TokenType.plus) {
        if (AComputable.isNumeric(l) && AComputable.isNumeric(r)) {
          result = { result: l + r };
        } else if (
          AComputable.isMatrix(l) &&
          (AComputable.isNumeric(r) || AComputable.isMatrix(r))
        ) {
          result = l.add(r);
        } else if (AComputable.isNumeric(l) && AComputable.isMatrix(r)) {
          result = r.add(l);
        }
      } else if (this.operator.type == TokenType.minus) {
        if (AComputable.isNumeric(l) && AComputable.isNumeric(r)) {
          result = { result: l - r };
        } else if (
          AComputable.isMatrix(l) &&
          (AComputable.isNumeric(r) || AComputable.isMatrix(r))
        ) {
          result = l.sub(r);
        } else if (AComputable.isNumeric(l) && AComputable.isMatrix(r)) {
          let tmp = r.mul(-1).result;
          if (AComputable.isMatrix(tmp)) {
            result = tmp.add(r);
          } else {
            throw new MatrixError("ummm... something went wrong");
          }
        }
      } else if (this.operator.type == TokenType.mul) {
        if (AComputable.isNumeric(l) && AComputable.isNumeric(r)) {
          result = { result: l * r };
        } else if (
          AComputable.isMatrix(l) &&
          (AComputable.isNumeric(r) || AComputable.isMatrix(r))
        ) {
          result = l.mul(r);
        } else if (AComputable.isNumeric(l) && AComputable.isMatrix(r)) {
          result = r.mul(l);
        }
      } else if (this.operator.type == TokenType.div) {
        if (AComputable.isNumeric(l) && AComputable.isNumeric(r)) {
          result = { result: l / r };
        } else if (
          AComputable.isMatrix(l) &&
          (AComputable.isNumeric(r) || AComputable.isMatrix(r))
        ) {
          result = l.div(r);
        } else if (AComputable.isNumeric(l) && AComputable.isMatrix(r)) {
          result = r.div(l);
        }
      } else if (this.operator.type == TokenType.rdiv) {
        if (AComputable.isNumeric(l) && AComputable.isNumeric(r)) {
          result = { result: Math.floor(l / r) };
        } else if (
          AComputable.isMatrix(l) &&
          (AComputable.isNumeric(r) || AComputable.isMatrix(r))
        ) {
          result = l.rdiv(r);
        } else if (AComputable.isNumeric(l) && AComputable.isMatrix(r)) {
          result = r.rdiv(l);
        }
      } else if (this.operator.type == TokenType.pow) {
        if (AComputable.isNumeric(l) && AComputable.isNumeric(r)) {
          result = { result: Math.pow(l, r) };
        } else if (
          AComputable.isMatrix(l) &&
          (AComputable.isNumeric(r) || AComputable.isMatrix(r))
        ) {
          result = l.pow(r);
        } else if (AComputable.isNumeric(l) && AComputable.isMatrix(r)) {
          result = r.pow(l);
        }
      }
    }

    if (result?.message) {
      console.log(result?.message);
    }
    console.log(result?.result.toString());
    return result?.result;
  }

  public get _children(): AST[] {
    return [this.left, this.right];
  }

  public get _node_value_string(): string {
    return this.operator.type.toString();
  }
}

/**
 * holds a variable and its value
 */
export class VariableNode extends ComputableNode {
  private token: Token;
  private _value: string;

  public get value(): string {
    return this._value;
  }

  constructor(token: SymbolToken) {
    super();
    this.token = token;
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
  get _children(): AbstractSyntaxTree[] {
    return [];
  }
  get _node_value_string(): string {
    throw new Error("Method not implemented.");
  }
}

/**
 * stores a single value: number or matrix
 */
export class SingleValueNode extends ComputableNode {
  private value: Computable;

  constructor(value: Computable) {
    super();
    this.value = value;
  }

  public eval(): Computable {
    if (AComputable.isNumeric(this.value)) {
      return this.value;
    } else if (AComputable.isMatrix(this.value)) {
      this.value.evaluate();
      return this.value;
    } else {
      throw new SyntaxError("invalid single value node!");
    }
  }

  public get _children(): AST[] {
    return [];
  }

  public get _node_value_string(): string {
    return this.value.toString();
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
      // return next element as is
      return this.next.eval();
    } else if (this.token.type == TokenType.minus) {
      // take negation of next element
      let out = this.next.eval();
      if (AComputable.isNumeric(out)) {
        return -1 * out;
      } else if (AComputable.isMatrix(out)) {
        return out.mul(-1).result;
      } else {
        throw new ArithmeticError("couldn't evaluate negation of item");
      }
    } else {
      throw new SymbolError(
        "unexpected unary operator: " + this.token.type.toString()
      );
    }
  }

  public get _children(): AST[] {
    return [this.next];
  }

  public get _node_value_string(): string {
    return this.token.type.toString();
  }
}

export module util {
  interface NodeLevel {
    node: AST;
    level: number;
    strLength: number;
  }

  export function printTreeLevelOrder(tree: AST) {
    let queue: Queue<NodeLevel> = new Queue();
    let currentLevel: number = 0;
    let str = "";
    let arrows: string = "";
    let space = " ";
    let extraspace = "  ";
    // initialize first element
    let node: NodeLevel | undefined = {
      node: tree,
      level: currentLevel,
      strLength: 0,
    };
    // continue until node is null
    while (node) {
      if (node.level > currentLevel) {
        process.stdout.write(str);
        process.stdout.write("\n" + arrows + "\n");
        str = "";
        arrows = "";
        currentLevel = node.level;
      }
      let children = node.node._children;
      switch (children.length) {
        case 0:
          arrows += "   ";
          break;
        case 1:
          while (arrows.length < node.strLength) {
            arrows += " ";
          }
          arrows += "|" + space;
          break;
        case 2:
          while (arrows.length < node.strLength) {
            arrows += " ";
          }
          arrows += "|" + space + "\\" + extraspace;
          break;
      }

      while (str.length < node?.strLength) {
        str += " ";
      }
      for (let x of children) {
        queue.push({ node: x, level: node.level + 1, strLength: str.length });
      }
      str += node.node._node_value_string + extraspace;

      // dequeue next element
      node = queue.pop();
    }
    process.stdout.write(str);
    process.stdout.write("\n");
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
