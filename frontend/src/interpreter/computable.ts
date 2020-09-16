import { AST, ComputableNode } from "./ast";
import { ArithmeticError, MatrixError, ParsingError } from "./errors";

export type Computable = number | AComputable;

export interface Result {
  result: Computable;
  message?: string;
}

interface MatrixResult extends Result {
  result: Matrix;
}

export abstract class AComputable {
  public abstract add(other: number): Result;
  public abstract add(other: AComputable): Result;
  public abstract sub(other: number): Result;
  public abstract sub(other: AComputable): Result;
  public abstract mul(other: number): Result;
  public abstract mul(other: AComputable): Result;
  public abstract div(other: number): Result;
  public abstract div(other: AComputable): Result;
  public abstract pow(other: number): Result;
  public abstract pow(other: AComputable): Result;

  /**
   * checks if given element is of type matrix
   * @param el any element
   */
  public static isMatrix(el: Computable): el is Matrix {
    return el instanceof Matrix;
  }

  /**
   * checks if given element is of type number
   * @param el any element
   */
  public static isNumeric(el: Computable): el is number {
    return typeof el === "number";
  }

  /**
   * checks if given element is of type computable
   * @param el any element
   */
  public static isComputable(el: any): el is Computable {
    return el instanceof AComputable || typeof el === "number";
  }
}

export class Matrix extends AComputable {
  matrix: number[][] | undefined;
  private nodes: ComputableNode[][];
  dimR: number;
  dimC: number;

  constructor(
    nodes: ComputableNode[][] | undefined = new Array(),
    rows: number[][] | undefined = undefined
  ) {
    super();
    if (!rows) {
      // raw node matrix
      this.nodes = nodes;
      this.matrix = undefined;
      this.dimR = nodes.length;
      this.dimC = this.dimR > 0 ? nodes[0].length : 0;

      // verify each row is the same length
      for (let row of nodes) {
        if (row.length != this.dimC) {
          throw new MatrixError("row dimensions did not match");
        }
      }
    } else {
      // populate matrix with numbers
      this.nodes = new Array();
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
  }

  private checkDimensions(other: Matrix) {
    if (this.dimR != other.dimR || this.dimC != other.dimC) {
      throw new MatrixError(
        `can't add matricies of different dimensions! (${this.dimR} x ${this.dimC}) and (${other.dimR} x ${other.dimC})`
      );
    }
  }

  /**
   * add two matricies together by elementwise addition or add a constant to the matrix
   * @param other a computable object
   */
  public add(other: Computable): MatrixResult {
    if (this.matrix) {
      let arr: number[][] = new Array();
      if (AComputable.isMatrix(other) && other.matrix) {
        // add two matricies together
        this.checkDimensions(other);
        for (let i = 0; i < this.dimR; i++) {
          arr.push([]);
          for (let j = 0; j < this.dimC; j++) {
            arr[i].push(this.matrix[i][j] + other.matrix[i][j]);
          }
        }
      } else if (AComputable.isNumeric(other)) {
        // add constant to each element
        for (let i = 0; i < this.dimR; i++) {
          arr.push([]);
          for (let j = 0; j < this.dimC; j++) {
            arr[i].push(this.matrix[i][j] + other);
          }
        }
      }

      return { result: new Matrix(undefined, arr) };
    }
    throw new ParsingError("matrix has not been evaluated yet.");
  }

  /**
   * subtracts matrix from this, or subtracts constant from each element
   * @param other any computable item
   */
  public sub(other: Computable): MatrixResult {
    if (this.matrix) {
      let arr: number[][] = new Array();

      if (AComputable.isMatrix(other) && other.matrix) {
        // subtract two matricies together
        this.checkDimensions(other);
        for (let i = 0; i < this.dimR; i++) {
          arr.push([]);
          for (let j = 0; j < this.dimC; j++) {
            arr[i].push(this.matrix[i][j] - other.matrix[i][j]);
          }
        }
      } else if (AComputable.isNumeric(other)) {
        // subtract constant to each element
        for (let i = 0; i < this.dimR; i++) {
          arr.push([]);
          for (let j = 0; j < this.dimC; j++) {
            arr[i].push(this.matrix[i][j] - other);
          }
        }
      }

      return { result: new Matrix(undefined, arr) };
    }
    throw new ParsingError("matrix has not been evaluated yet.");
  }

  /**
   * element-wise multiplication
   * @param other
   */
  public el_mul(other: Matrix): MatrixResult {
    if (this.matrix && other.matrix) {
      if (this.dimC == other.dimC && this.dimR == other.dimR) {
        let arr: number[][] = new Array();
        for (let i = 0; i < this.dimR; i++) {
          arr.push([]);
          for (let j = 0; j < this.dimC; j++) {
            arr[i].push(this.matrix[i][j] * other.matrix[i][j]);
          }
        }
        return { result: new Matrix(undefined, arr) };
      } else {
        throw new MatrixError(
          "cannot do element-wise multiplication on different sized matricies"
        );
      }
    }

    throw new ParsingError("matrix hasn't been evaulated yet!");
  }

  /**
   * computes the matrix product or multiplies a matrix by a scalar
   * @param other any computable item
   */
  public mul(other: Computable): Result {
    if (this.matrix) {
      if (AComputable.isMatrix(other)) {
        if (other.matrix) {
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
          }
          if (newMatrix.length == 1 && newMatrix[0].length == 1) {
            return { result: newMatrix[0][0] };
          } else {
            return { result: new Matrix(undefined, newMatrix) };
          }
        }
      } else if (AComputable.isNumeric(other)) {
        let arr: number[][] = new Array();
        // multiply constant to each element
        for (let i = 0; i < this.dimR; i++) {
          arr.push([]);
          for (let j = 0; j < this.dimC; j++) {
            arr[i].push(this.matrix[i][j] * other);
          }
        }
        return { result: new Matrix(undefined, arr) };
      } else {
        throw new MatrixError("couldn't multiply with a " + other);
      }
    }
    throw new ParsingError("matrix has not been evaluated yet.");
  }

  /**
   * divide by a scalar, matrix division is not supported
   * @param other
   */
  public div(other: Computable): MatrixResult {
    if (this.matrix) {
      if (AComputable.isNumeric(other)) {
        let arr: number[][] = new Array();
        // multiply constant to each element
        for (let i = 0; i < this.dimR; i++) {
          arr.push([]);
          for (let j = 0; j < this.dimC; j++) {
            arr[i].push(this.matrix[i][j] / other);
          }
        }
        return { result: new Matrix(undefined, arr) };
      }
      throw new MatrixError("matrix division is not supported.");
    }

    throw new ParsingError("matrix has not been evaluated yet.");
  }

  /**
   * divide by a scalar, matrix division is not supported
   * @param other
   */
  public rdiv(other: Computable): MatrixResult {
    if (this.matrix) {
      if (AComputable.isNumeric(other)) {
        let arr: number[][] = new Array();
        // multiply constant to each element
        for (let i = 0; i < this.dimR; i++) {
          arr.push([]);
          for (let j = 0; j < this.dimC; j++) {
            arr[i].push(Math.floor(this.matrix[i][j] / other));
          }
        }
        return { result: new Matrix(undefined, arr) };
      }
      throw new MatrixError("matrix division is not supported.");
    }

    throw new ParsingError("matrix has not been evaluated yet.");
  }

  /**
   * take power
   * @param other
   */
  public pow(other: Computable): MatrixResult {
    if (this.matrix) {
      if (this.dimR != this.dimC) {
        throw new MatrixError(
          "only square matricies can be raised to the power"
        );
      }
      if (AComputable.isNumeric(other)) {
        let newMatrix: Matrix = this;
        for (let i = 0; i < other; i++) {
          let tmp = newMatrix.mul(this).result;
          if (AComputable.isMatrix(tmp)) {
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
    throw new ParsingError("matrix has not been evaluated yet.");
  }

  /**
   * evaluates matrix from raw nodes
   */
  public evaluate() {
    if (!this.matrix) {
      let arr: number[][] = new Array();
      for (let row = 0; row < this.dimR; row++) {
        arr.push([]);
        for (let col = 0; col < this.dimC; col++) {
          let val = this.nodes[row][col].eval();
          if (AComputable.isNumeric(val)) {
            arr[row].push(val);
          } else {
            throw new SyntaxError(
              "couldn't evaluate matrix! expected numbers."
            );
          }
        }
      }
      this.matrix = arr;
    }
  }

  public transpose(save: boolean = false): MatrixResult {
    if (this.matrix) {
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
      return { result: new Matrix(undefined, arr) };
    }
    throw new ParsingError("matrix has not been evaluated yet!");
  }

  public toString(): string {
    let m = this.matrix;
    if (m) {
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
    } else {
      throw new ParsingError("matrix has not been evaluated yet!");
    }
  }
}
