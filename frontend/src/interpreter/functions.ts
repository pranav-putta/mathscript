import { AST } from "./ast";
import { isMatrix, isNumeric, Matrix } from "./computable";
import { ArgumentError, ParsingError } from "./errors";

/**
 * takes rref and stores into matrix
 * @param node
 */
export function rref(node: AST) {
  let matrix = node.eval();
  if (isMatrix(matrix) && matrix.matrix) {
    var lead = 0;
    for (var k = 0; k < matrix.dimR; k++) {
      if (matrix.dimC <= lead) return matrix;

      var i = k;
      while (matrix.matrix[i][lead] === 0) {
        i++;
        if (matrix.dimR === i) {
          i = k;
          lead++;
          if (matrix.dimC === lead) return matrix;
        }
      }
      var irow = matrix.matrix[i],
        krow = matrix.matrix[k];
      matrix.matrix[i] = krow;
      matrix.matrix[k] = irow;

      var val = matrix.matrix[k][lead];
      for (var j = 0; j < matrix.dimC; j++) {
        matrix.matrix[k][j] /= val;
      }

      for (var i = 0; i < matrix.dimR; i++) {
        if (i === k) continue;
        val = matrix.matrix[i][lead];
        for (var j = 0; j < matrix.dimC; j++) {
          matrix.matrix[i][j] -= val * matrix.matrix[k][j];
        }
      }
      lead++;
    }
    return matrix;
  } else {
    throw new ArgumentError("expected a matrix.");
  }
}

/**
 * takes transpose and stores into matrix
 * @param node
 */
export function transpose(node: AST) {
  let matrix = node.eval();
  if (isMatrix(matrix)) {
    return matrix.transpose(true).result;
  } else {
    throw new ArgumentError("expected a matrix");
  }
}

/**
 * takes determinant
 * @param node
 */
export function det(node: AST) {
  let matrix = node.eval();
  if (isMatrix(matrix)) {
    return matrix.determinant();
  } else {
    throw new ArgumentError("expected a matrix");
  }
}

export function sqrt(node: AST) {
  let num = node.eval();
  if (isNumeric(num)) {
    return Math.sqrt(num.value);
  } else {
    throw new ArgumentError("expected a number");
  }
}

export function identity(node: AST): Matrix {
  if (!node) {
    throw new ParsingError("expected an integer parameter");
  }
  let num = node.eval();
  if (isNumeric(num)) {
    let arr: number[][] = [];
    for (let i = 0; i < num.value; i++) {
      arr.push([]);
      for (let j = 0; j < num.value; j++) {
        arr[i].push(i == j ? 1 : 0);
      }
    }
    return new Matrix(arr);
  } else {
    throw new ArgumentError("expected a number");
  }
}
