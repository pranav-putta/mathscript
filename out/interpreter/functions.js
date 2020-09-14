"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpose = exports.rref = void 0;
var computable_1 = require("./computable");
var errors_1 = require("./errors");
/**
 *
 * @param node
 */
function rref(node) {
    var matrix = node.eval();
    if (computable_1.AComputable.isMatrix(matrix) && matrix.rows) {
        var lead = 0;
        for (var k = 0; k < matrix.dimR; k++) {
            if (matrix.dimC <= lead)
                return matrix;
            var i = k;
            while (matrix.rows[i][lead] === 0) {
                i++;
                if (matrix.dimR === i) {
                    i = k;
                    lead++;
                    if (matrix.dimC === lead)
                        return matrix;
                }
            }
            var irow = matrix.rows[i], krow = matrix.rows[k];
            (matrix.rows[i] = krow), (matrix.rows[k] = irow);
            var val = matrix.rows[k][lead];
            for (var j = 0; j < matrix.dimC; j++) {
                matrix.rows[k][j] /= val;
            }
            for (var i = 0; i < matrix.dimR; i++) {
                if (i === k)
                    continue;
                val = matrix.rows[i][lead];
                for (var j = 0; j < matrix.dimC; j++) {
                    matrix.rows[i][j] -= val * matrix.rows[k][j];
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
function transpose(node) {
    var matrix = node.eval();
    if (computable_1.AComputable.isMatrix(matrix)) {
        return matrix.transpose(true).result;
    }
    else {
        throw new errors_1.ArgumentError("expected a matrix");
    }
}
exports.transpose = transpose;
//# sourceMappingURL=functions.js.map