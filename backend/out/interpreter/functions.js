"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqrt = exports.det = exports.transpose = exports.rref = void 0;
var computable_1 = require("./computable");
var errors_1 = require("./errors");
/**
 * takes rref and stores into matrix
 * @param node
 */
function rref(node) {
    var matrix = node.eval();
    if (computable_1.isMatrix(matrix) && matrix.matrix) {
        var lead = 0;
        for (var k = 0; k < matrix.dimR; k++) {
            if (matrix.dimC <= lead)
                return matrix;
            var i = k;
            while (matrix.matrix[i][lead] === 0) {
                i++;
                if (matrix.dimR === i) {
                    i = k;
                    lead++;
                    if (matrix.dimC === lead)
                        return matrix;
                }
            }
            var irow = matrix.matrix[i], krow = matrix.matrix[k];
            matrix.matrix[i] = krow;
            matrix.matrix[k] = irow;
            var val = matrix.matrix[k][lead];
            for (var j = 0; j < matrix.dimC; j++) {
                matrix.matrix[k][j] /= val;
            }
            for (var i = 0; i < matrix.dimR; i++) {
                if (i === k)
                    continue;
                val = matrix.matrix[i][lead];
                for (var j = 0; j < matrix.dimC; j++) {
                    matrix.matrix[i][j] -= val * matrix.matrix[k][j];
                }
            }
            lead++;
        }
        return matrix;
    }
    else {
        throw new errors_1.ArgumentError("expected a matrix.");
    }
}
exports.rref = rref;
/**
 * takes transpose and stores into matrix
 * @param node
 */
function transpose(node) {
    var matrix = node.eval();
    if (computable_1.isMatrix(matrix)) {
        return matrix.transpose(true).result;
    }
    else {
        throw new errors_1.ArgumentError("expected a matrix");
    }
}
exports.transpose = transpose;
/**
 * takes determinant
 * @param node
 */
function det(node) {
    var matrix = node.eval();
    if (computable_1.isMatrix(matrix)) {
        return matrix.determinant();
    }
    else {
        throw new errors_1.ArgumentError("expected a matrix");
    }
}
exports.det = det;
function sqrt(node) {
    var num = node.eval();
    if (computable_1.isNumeric(num)) {
        return Math.sqrt(num.value);
    }
    else {
        throw new errors_1.ArgumentError("expected a square root");
    }
}
exports.sqrt = sqrt;
//# sourceMappingURL=functions.js.map