import { AST } from "../ast";
import { isMatrix, isNumeric, Matrix, Numeric } from "../computable";
import { ArgumentError, ParsingError } from "../errors";

/**
 * takes rref and stores into matrix
 * @param node
 */
export function rref(matrix: Matrix) {
  if (isMatrix(matrix)) {
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
    throw new ArgumentError("expected a matrix. " + matrix);
  }
}

/**
 * takes transpose and stores into matrix
 * @param node
 */
export function transpose(matrix: Matrix) {
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
export function det(matrix: Matrix) {
  if (isMatrix(matrix)) {
    return matrix.determinant();
  } else {
    throw new ArgumentError("expected a matrix");
  }
}

export function sqrt(num: Numeric) {
  if (isNumeric(num)) {
    return num.pow(new Numeric(0.5)).result;
  } else {
    throw new ArgumentError("expected a number");
  }
}

export function identity(num: Numeric): Matrix {
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

function rationalApprox(t: number) {
  let c = [2.515517, 0.802853, 0.010328];
  let d = [1.432788, 0.189269, 0.001308];
  return (
    t -
    ((c[2] * t + c[1]) * t + c[0]) / (((d[2] * t + d[1]) * t + d[0]) * t + 1.0)
  );
}

function invNormCDF(p: number) {
  if (p < 0.5) {
    return -rationalApprox(Math.sqrt(-2 * Math.log(p)));
  } else {
    return -rationalApprox(Math.sqrt(-2 * Math.log(1 - p)));
  }
}

export function confidenceIntervalProportions(
  p: Numeric,
  n: Numeric,
  ci: Numeric
) {
  let prob = (p: number) => {
    return (1 - p) / 2 + p;
  };
  let z = invNormCDF(prob(ci.value));
  let r = z * Math.sqrt((p.value * (1 - p.value)) / n.value);
  return [
    Math.round((p.value + r) * 1000) / 1000,
    Math.round((p.value - r) * 1000) / 1000,
  ];
}

export function confidenceIntervalMean(x: Numeric, s: Numeric, n: Numeric, ci: Numeric) {
  let prob = (p: number) => {
    return (1 - p) / 2 + p;
  };
  let z = invNormCDF(prob(ci.value));
  let r = z * (s.value / Math.sqrt(n.value))
  return [
    Math.round((x.value + r) * 1000) / 1000,
    Math.round((x.value - r) * 1000) / 1000,
  ];
}