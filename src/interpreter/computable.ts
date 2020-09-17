import { ComputableNode } from "./ast";
import { ArithmeticError, MatrixError } from "./errors";
import { TokenType } from "./token";

export interface Result {
  result: Computable;
  message?: string;
}

export abstract class Computable {
  public abstract add(other: Computable): Result;
  public abstract sub(other: Computable): Result;
  public abstract mul(other: Computable): Result;
  public abstract div(other: Computable): Result;
  public abstract rdiv(other: Computable): Result;
  public abstract pow(other: Computable): Result;
}

/**
 * checks if given element is of type computable
 * @param el any element
 */
export function isComputable(el: any): el is Computable {
  return el instanceof Computable;
}

export function computeResult(
  a: Computable,
  b: Computable,
  operator: TokenType
): Result {
  switch (operator) {
    case TokenType.plus:
      return a.add(b);
    case TokenType.minus:
      return a.sub(b);
    case TokenType.mul:
      return a.mul(b);
    case TokenType.div:
      return a.div(b);
    case TokenType.rdiv:
      return a.rdiv(b);
    case TokenType.pow:
      return a.pow(b);
  }
  if (isLogical(a) && isLogical(b)) {
    switch (operator) {
      case TokenType.and_bool:
        return a.and(b);
      case TokenType.or_bool:
        return a.or(b);
    }
  }
  throw new ArithmeticError("unsupported operation " + operator.toString());
}

export interface MatrixResult extends Result {
  result: Matrix;
}

export class UnevaluatedMatrix {
  private matrix: ComputableNode[][];
  private dimR: number;
  private dimC: number;
  /**
   * constructs a new matrix
   * @param nodes optional: matrix as nodes if matrix unevaluated
   * @param rows optional: matrix as numeric array if matrix evaluated
   */
  constructor(nodes: ComputableNode[][]) {
    // raw node matrix
    this.matrix = nodes;
    this.dimR = nodes.length;
    this.dimC = this.dimR > 0 ? nodes[0].length : 0;

    // verify each row is the same length
    for (let row of nodes) {
      if (row.length != this.dimC) {
        throw new MatrixError("row dimensions did not match");
      }
    }
  }

  /**
   * evaluates matrix from raw nodes
   */
  public evaluate(): Matrix {
    let arr: number[][] = new Array();
    for (let row = 0; row < this.dimR; row++) {
      arr.push([]);
      for (let col = 0; col < this.dimC; col++) {
        let val = this.matrix[row][col].eval();
        if (isNumeric(val)) {
          arr[row].push(val.value);
        } else {
          throw new SyntaxError("couldn't evaluate matrix! expected numbers.");
        }
      }
    }
    return new Matrix(arr);
  }

  public static isUnevaluatedMatrix(m: any): m is UnevaluatedMatrix {
    return m instanceof UnevaluatedMatrix;
  }
}

export class Matrix extends Computable {
  matrix: number[][];
  dimR: number;
  dimC: number;

  /**
   * constructs a new matrix
   * @param nodes optional: matrix as nodes if matrix unevaluated
   * @param rows optional: matrix as numeric array if matrix evaluated
   */
  constructor(rows: number[][]) {
    super();

    this.matrix = rows;
    this.dimR = rows.length;
    this.dimC = this.dimR > 0 ? rows[0].length : 0;

    // verify each row is the same length
    for (let row of rows) {
      if (row.length != this.dimC) {
        throw new MatrixError("row dimensions did not match");
      }
    }
  }

  private checkDimensions(other: Matrix) {
    if (this.dimR != other.dimR || this.dimC != other.dimC) {
      throw new MatrixError(
        `can't perform operations on matricies of different dimensions! (${this.dimR} x ${this.dimC}) and (${other.dimR} x ${other.dimC})`
      );
    }
  }

  private expectedMatrixError(): never {
    throw new ArithmeticError("expected a matrix for calculations.");
  }

  private expectedMatrixOrNumericError(): never {
    throw new ArithmeticError("expected a matrix or numeric for calculations.");
  }

  /**
   * add two matricies together by elementwise addition or add a constant to the matrix
   * @param other a computable object
   */
  public add(other: Computable): MatrixResult {
    let arr: number[][] = new Array();
    if (isMatrix(other)) {
      // add two matricies together
      this.checkDimensions(other);
      for (let i = 0; i < this.dimR; i++) {
        arr.push([]);
        for (let j = 0; j < this.dimC; j++) {
          arr[i].push(this.matrix[i][j] + other.matrix[i][j]);
        }
      }
    } else if (isNumeric(other)) {
      // add constant to each element
      for (let i = 0; i < this.dimR; i++) {
        arr.push([]);
        for (let j = 0; j < this.dimC; j++) {
          arr[i].push(this.matrix[i][j] + other.value);
        }
      }
    } else {
      this.expectedMatrixOrNumericError();
    }

    return { result: new Matrix(arr) };
  }

  /**
   * subtracts matrix from this, or subtracts constant from each element
   * @param other any computable item
   */
  public sub(other: Computable): MatrixResult {
    let arr: number[][] = new Array();

    if (isMatrix(other)) {
      // subtract two matricies together
      this.checkDimensions(other);
      for (let i = 0; i < this.dimR; i++) {
        arr.push([]);
        for (let j = 0; j < this.dimC; j++) {
          arr[i].push(this.matrix[i][j] - other.matrix[i][j]);
        }
      }
    } else if (isNumeric(other)) {
      // subtract constant to each element
      for (let i = 0; i < this.dimR; i++) {
        arr.push([]);
        for (let j = 0; j < this.dimC; j++) {
          arr[i].push(this.matrix[i][j] - other.value);
        }
      }
    } else {
      this.expectedMatrixOrNumericError();
    }

    return { result: new Matrix(arr) };
  }

  /**
   * element-wise multiplication
   * @param other
   */
  public el_mul(other: Matrix): MatrixResult {
    if (this.dimC == other.dimC && this.dimR == other.dimR) {
      let arr: number[][] = new Array();
      for (let i = 0; i < this.dimR; i++) {
        arr.push([]);
        for (let j = 0; j < this.dimC; j++) {
          arr[i].push(this.matrix[i][j] * other.matrix[i][j]);
        }
      }
      return { result: new Matrix(arr) };
    } else {
      throw new MatrixError(
        "cannot do element-wise multiplication on different sized matricies"
      );
    }
  }

  /**
   * computes the matrix product or multiplies a matrix by a scalar
   * @param other any computable item
   */
  public mul(other: Computable): Result {
    if (isMatrix(other)) {
      // multiply two matricies
      // check dimensions are proper
      if (this.dimC != other.dimR) {
        if (this.dimC == other.dimC && this.dimR == other.dimR) {
          return {
            result: this.mul(other.transpose().result).result,
            message: "inferred to take dot product.",
          };
        }
        throw new MatrixError(
          `can't multiply matricies of non-matching dimensions! (${this.dimR} x ${this.dimC}) and (${other.dimR} x ${other.dimC})`
        );
      }
      let newMatrix: number[][] = new Array();
      for (let i = 0; i < this.dimR; i++) {
        newMatrix.push([]);
        for (let j = 0; j < other.dimC; j++) {
          let temp = 0;
          for (let k = 0; k < this.dimC; k++) {
            temp += this.matrix[i][k] * other.matrix[k][j];
          }
          newMatrix[i].push(temp);
        }

        if (newMatrix.length == 1 && newMatrix[0].length == 1) {
          return { result: new Numeric(newMatrix[0][0]) };
        } else {
          return { result: new Matrix(newMatrix) };
        }
      }
    } else if (isNumeric(other)) {
      let arr: number[][] = new Array();
      // multiply constant to each element
      for (let i = 0; i < this.dimR; i++) {
        arr.push([]);
        for (let j = 0; j < this.dimC; j++) {
          arr[i].push(this.matrix[i][j] * other.value);
        }
      }
      return { result: new Matrix(arr) };
    }
    this.expectedMatrixOrNumericError();
  }

  /**
   * divide by a scalar, matrix division is not supported
   * @param other
   */
  public div(other: Computable): MatrixResult {
    if (isNumeric(other)) {
      let arr: number[][] = new Array();
      // multiply constant to each element
      for (let i = 0; i < this.dimR; i++) {
        arr.push([]);
        for (let j = 0; j < this.dimC; j++) {
          arr[i].push(this.matrix[i][j] / other.value);
        }
      }
      return { result: new Matrix(arr) };
    }
    this.expectedMatrixError();
  }

  /**
   * divide by a scalar, matrix division is not supported
   * @param other
   */
  public rdiv(other: Computable): MatrixResult {
    if (isNumeric(other)) {
      let arr: number[][] = new Array();
      // multiply constant to each element
      for (let i = 0; i < this.dimR; i++) {
        arr.push([]);
        for (let j = 0; j < this.dimC; j++) {
          arr[i].push(Math.floor(this.matrix[i][j] / other.value));
        }
      }
      return { result: new Matrix(arr) };
    }
    this.expectedMatrixError();
  }

  /**
   * take power
   * @param other
   */
  public pow(other: Computable): MatrixResult {
    if (this.dimR != this.dimC) {
      throw new MatrixError("only square matricies can be raised to the power");
    }
    if (isNumeric(other)) {
      let newMatrix: Matrix = this;
      for (let i = 0; i < other.value; i++) {
        let tmp = newMatrix.mul(this).result;
        if (isMatrix(tmp)) {
          newMatrix = tmp;
        } else {
          throw new MatrixError("multiplication failed: " + tmp);
        }
      }
      return { result: newMatrix };
    } else {
      throw new MatrixError("matrix power is not supported");
    }
  }

  public transpose(save: boolean = false): MatrixResult {
    let arr: number[][] = new Array();
    for (let i = 0; i < this.dimC; i++) {
      arr.push([]);
      for (let j = 0; j < this.dimR; j++) {
        arr[i].push(this.matrix[j][i]);
      }
    }

    if (save) {
      this.matrix = arr;
      let tmp = this.dimR;
      this.dimR = this.dimC;
      this.dimC = tmp;
      return { result: this };
    }
    return { result: new Matrix(arr) };
  }

  public determinant(): number {
    if (this.dimR != this.dimC) {
      throw new MatrixError("cannot take determinant of non-square matrix");
    }

    let n = this.dimR;
    let M = this.matrix;
    if (n == 2) {
      return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    } else {
      let d = 0;
      for (let i = 0; i < n; i++) {
        // create a sub matrix
        let subMatrix: number[][] = [];
        for (let r = 0; r < n; r++) {
          subMatrix.push([]);
          for (let c = 0; c < n; c++) {
            if (c != i) {
              subMatrix[r].push(this.matrix[r][c]);
            }
          }
        }

        d += M[0][i] * new Matrix(subMatrix).determinant();
      }
      return d;
    }
  }

  public subMatrix(
    startRow: number,
    endRow: number = this.dimR - 1,
    startCol: number,
    endCol: number = this.dimC - 1
  ): Matrix {
    let arr: number[][] = new Array();
    for (let i = startRow; i <= endRow; i++) {
      arr.push([]);
      for (let j = startCol; j <= endCol; j++) {
        arr[i].push(this.matrix[i][j]);
      }
    }
    return new Matrix(arr);
  }

  public toString(): string {
    let m = this.matrix;
    let str = "";
    if (m.length == 1) {
      str += "< ";
      for (let i = 0; i < this.dimC; i++) {
        str += m[0][i];
        if (i != m[0].length - 1) {
          str += " ";
        }
      }
      str += " >";
    } else {
      str += "[";
      for (let i = 0; i < this.dimR; i++) {
        if (i != 0) {
          str += " ";
        }
        str += "[ ";
        for (let j = 0; j < this.dimC; j++) {
          str += m[i][j] + " ";
        }
        str += "]";
        if (i != this.dimR - 1) {
          str += "\n";
        }
      }
      str += "]";
      str += `  { ${this.dimR} x ${this.dimC} }`;
    }

    return str;
  }
}

export function isMatrix(el: any): el is Matrix {
  return el instanceof Matrix;
}

export class Numeric extends Computable {
  value: number;

  constructor(val: number) {
    super();
    this.value = val;
  }

  private error(): never {
    throw new ArithmeticError("cannot add numeric with non-numeric");
  }

  public add(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(this.value + other.value) };
    } else if (isMatrix(other)) {
      return other.add(this);
    }
    this.error();
  }

  public sub(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(this.value - other.value) };
    } else if (isMatrix(other)) {
      return other.mul(new Numeric(-1)).result.add(this);
    }
    this.error();
  }

  public mul(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(this.value * other.value) };
    } else if (isMatrix(other)) {
      return other.mul(this);
    }
    this.error();
  }

  public div(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(this.value / other.value) };
    } else if (isMatrix(other)) {
      return other.div(this);
    }
    this.error();
  }

  public rdiv(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(Math.floor(this.value / other.value)) };
    } else if (isMatrix(other)) {
      return other.rdiv(this);
    }
    this.error();
  }

  public pow(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(Math.pow(this.value, other.value)) };
    }
    this.error();
  }

  public toString(): string {
    return this.value.toString();
  }
}

export function isNumeric(el: any): el is Numeric {
  return el instanceof Numeric;
}

export interface LogicalResult extends Result {
  result: Logical;
}
/**
 * boolean computable value
 */
export class Logical extends Numeric {
  private boolVal: boolean;

  constructor(value: boolean) {
    super(value ? 1 : 0);
    this.boolVal = value;
  }

  public add(other: Computable): Result {
    return other.add(new Numeric(this.value));
  }
  public sub(other: Computable): Result {
    return other.add(new Numeric(this.value * -1));
  }
  public mul(other: Computable): Result {
    return other.mul(new Numeric(this.value));
  }
  public div(other: Computable): Result {
    throw new ArithmeticError("boolean division is not supported");
  }

  public rdiv(other: Computable): Result {
    throw new ArithmeticError("boolean division is not supported");
  }
  public pow(other: Computable): Result {
    throw new ArithmeticError("boolean powers not supported");
  }

  public or(other: Logical): LogicalResult {
    return { result: new Logical(this.boolVal || other.boolVal) };
  }

  public and(other: Logical): LogicalResult {
    return { result: new Logical(this.boolVal && other.boolVal) };
  }

  public xor(other: Logical): LogicalResult {
    return { result: new Logical(this.boolVal !== other.boolVal) };
  }

  public nand(other: Logical): LogicalResult {
    return {
      result: new Logical(this.boolVal == other.boolVal && !this.boolVal),
    };
  }

  public toString(): string {
    return new String(this.boolVal).toString();
  }
}

export function isLogical(el: any): el is Logical {
  return el instanceof Logical;
}
