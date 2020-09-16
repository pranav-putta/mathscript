import { AST } from "./ast";
import { AComputable, Matrix } from "./computable";
import { ArgumentError, MatrixError } from "./errors";

/**
 *
 * @param node
 */
export function rref(node: AST) {
  let matrix = node.eval();
  if (AComputable.isMatrix(matrix) && matrix.matrix) {
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

export function transpose(node: AST) {
  let matrix = node.eval();

  if (AComputable.isMatrix(matrix)) {
    return matrix.transpose(true).result;
  } else {
    throw new ArgumentError("expected a matrix");
  }
}

export function det(node: AST) {
  let matrix = node.eval();
  if (AComputable.isMatrix(matrix)) {
    return matrix.determinant();
  } else {
    throw new ArgumentError("expected a matrix");
  }
}
