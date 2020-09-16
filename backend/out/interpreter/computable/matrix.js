"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMatrix = exports.Matrix = exports.UnevaluatedMatrix = void 0;
var _1 = require(".");
var errors_1 = require("../errors");
var numeric_1 = require("./numeric");
var UnevaluatedMatrix = /** @class */ (function () {
    /**
     * constructs a new matrix
     * @param nodes optional: matrix as nodes if matrix unevaluated
     * @param rows optional: matrix as numeric array if matrix evaluated
     */
    function UnevaluatedMatrix(nodes) {
        // raw node matrix
        this.matrix = nodes;
        this.dimR = nodes.length;
        this.dimC = this.dimR > 0 ? nodes[0].length : 0;
        // verify each row is the same length
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var row = nodes_1[_i];
            if (row.length != this.dimC) {
                throw new errors_1.MatrixError("row dimensions did not match");
            }
        }
    }
    /**
     * evaluates matrix from raw nodes
     */
    UnevaluatedMatrix.prototype.evaluate = function () {
        var arr = new Array();
        for (var row = 0; row < this.dimR; row++) {
            arr.push([]);
            for (var col = 0; col < this.dimC; col++) {
                var val = this.matrix[row][col].eval();
                if (_1.isNumeric(val)) {
                    arr[row].push(val.value);
                }
                else {
                    throw new SyntaxError("couldn't evaluate matrix! expected numbers.");
                }
            }
        }
        return new Matrix(arr);
    };
    UnevaluatedMatrix.isUnevaluatedMatrix = function (m) {
        return m instanceof UnevaluatedMatrix;
    };
    return UnevaluatedMatrix;
}());
exports.UnevaluatedMatrix = UnevaluatedMatrix;
var Matrix = /** @class */ (function (_super) {
    __extends(Matrix, _super);
    /**
     * constructs a new matrix
     * @param nodes optional: matrix as nodes if matrix unevaluated
     * @param rows optional: matrix as numeric array if matrix evaluated
     */
    function Matrix(rows) {
        var _this = _super.call(this) || this;
        _this.matrix = rows;
        _this.dimR = rows.length;
        _this.dimC = _this.dimR > 0 ? rows[0].length : 0;
        // verify each row is the same length
        for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
            var row = rows_1[_i];
            if (row.length != _this.dimC) {
                throw new errors_1.MatrixError("row dimensions did not match");
            }
        }
        return _this;
    }
    Matrix.prototype.checkDimensions = function (other) {
        if (this.dimR != other.dimR || this.dimC != other.dimC) {
            throw new errors_1.MatrixError("can't perform operations on matricies of different dimensions! (" + this.dimR + " x " + this.dimC + ") and (" + other.dimR + " x " + other.dimC + ")");
        }
    };
    Matrix.prototype.expectedMatrixError = function () {
        throw new errors_1.ArithmeticError("expected a matrix for calculations.");
    };
    Matrix.prototype.expectedMatrixOrNumericError = function () {
        throw new errors_1.ArithmeticError("expected a matrix or numeric for calculations.");
    };
    /**
     * add two matricies together by elementwise addition or add a constant to the matrix
     * @param other a computable object
     */
    Matrix.prototype.add = function (other) {
        var arr = new Array();
        if (isMatrix(other)) {
            // add two matricies together
            this.checkDimensions(other);
            for (var i = 0; i < this.dimR; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimC; j++) {
                    arr[i].push(this.matrix[i][j] + other.matrix[i][j]);
                }
            }
        }
        else if (_1.isNumeric(other)) {
            // add constant to each element
            for (var i = 0; i < this.dimR; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimC; j++) {
                    arr[i].push(this.matrix[i][j] + other.value);
                }
            }
        }
        else {
            this.expectedMatrixOrNumericError();
        }
        return { result: new Matrix(arr) };
    };
    /**
     * subtracts matrix from this, or subtracts constant from each element
     * @param other any computable item
     */
    Matrix.prototype.sub = function (other) {
        var arr = new Array();
        if (isMatrix(other)) {
            // subtract two matricies together
            this.checkDimensions(other);
            for (var i = 0; i < this.dimR; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimC; j++) {
                    arr[i].push(this.matrix[i][j] - other.matrix[i][j]);
                }
            }
        }
        else if (_1.isNumeric(other)) {
            // subtract constant to each element
            for (var i = 0; i < this.dimR; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimC; j++) {
                    arr[i].push(this.matrix[i][j] - other.value);
                }
            }
        }
        else {
            this.expectedMatrixOrNumericError();
        }
        return { result: new Matrix(arr) };
    };
    /**
     * element-wise multiplication
     * @param other
     */
    Matrix.prototype.el_mul = function (other) {
        if (this.dimC == other.dimC && this.dimR == other.dimR) {
            var arr = new Array();
            for (var i = 0; i < this.dimR; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimC; j++) {
                    arr[i].push(this.matrix[i][j] * other.matrix[i][j]);
                }
            }
            return { result: new Matrix(arr) };
        }
        else {
            throw new errors_1.MatrixError("cannot do element-wise multiplication on different sized matricies");
        }
    };
    /**
     * computes the matrix product or multiplies a matrix by a scalar
     * @param other any computable item
     */
    Matrix.prototype.mul = function (other) {
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
                throw new errors_1.MatrixError("can't multiply matricies of non-matching dimensions! (" + this.dimR + " x " + this.dimC + ") and (" + other.dimR + " x " + other.dimC + ")");
            }
            var newMatrix = new Array();
            for (var i = 0; i < this.dimR; i++) {
                newMatrix.push([]);
                for (var j = 0; j < other.dimC; j++) {
                    var temp = 0;
                    for (var k = 0; k < this.dimC; k++) {
                        temp += this.matrix[i][k] * other.matrix[k][j];
                    }
                    newMatrix[i].push(temp);
                }
                if (newMatrix.length == 1 && newMatrix[0].length == 1) {
                    return { result: new numeric_1.Numeric(newMatrix[0][0]) };
                }
                else {
                    return { result: new Matrix(newMatrix) };
                }
            }
        }
        else if (_1.isNumeric(other)) {
            var arr = new Array();
            // multiply constant to each element
            for (var i = 0; i < this.dimR; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimC; j++) {
                    arr[i].push(this.matrix[i][j] * other.value);
                }
            }
            return { result: new Matrix(arr) };
        }
        this.expectedMatrixOrNumericError();
    };
    /**
     * divide by a scalar, matrix division is not supported
     * @param other
     */
    Matrix.prototype.div = function (other) {
        if (_1.isNumeric(other)) {
            var arr = new Array();
            // multiply constant to each element
            for (var i = 0; i < this.dimR; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimC; j++) {
                    arr[i].push(this.matrix[i][j] / other.value);
                }
            }
            return { result: new Matrix(arr) };
        }
        this.expectedMatrixError();
    };
    /**
     * divide by a scalar, matrix division is not supported
     * @param other
     */
    Matrix.prototype.rdiv = function (other) {
        if (_1.isNumeric(other)) {
            var arr = new Array();
            // multiply constant to each element
            for (var i = 0; i < this.dimR; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimC; j++) {
                    arr[i].push(Math.floor(this.matrix[i][j] / other.value));
                }
            }
            return { result: new Matrix(arr) };
        }
        this.expectedMatrixError();
    };
    /**
     * take power
     * @param other
     */
    Matrix.prototype.pow = function (other) {
        if (this.dimR != this.dimC) {
            throw new errors_1.MatrixError("only square matricies can be raised to the power");
        }
        if (_1.isNumeric(other)) {
            var newMatrix = this;
            for (var i = 0; i < other.value; i++) {
                var tmp = newMatrix.mul(this).result;
                if (isMatrix(tmp)) {
                    newMatrix = tmp;
                }
                else {
                    throw new errors_1.MatrixError("multiplication failed: " + tmp);
                }
            }
            return { result: newMatrix };
        }
        else {
            throw new errors_1.MatrixError("matrix power is not supported");
        }
    };
    Matrix.prototype.transpose = function (save) {
        if (save === void 0) { save = false; }
        var arr = new Array();
        for (var i = 0; i < this.dimC; i++) {
            arr.push([]);
            for (var j = 0; j < this.dimR; j++) {
                arr[i].push(this.matrix[j][i]);
            }
        }
        if (save) {
            this.matrix = arr;
            var tmp = this.dimR;
            this.dimR = this.dimC;
            this.dimC = tmp;
            return { result: this };
        }
        return { result: new Matrix(arr) };
    };
    Matrix.prototype.determinant = function () {
        if (this.dimR != this.dimC) {
            throw new errors_1.MatrixError("cannot take determinant of non-square matrix");
        }
        var n = this.dimR;
        var M = this.matrix;
        if (n == 2) {
            return M[0][0] * M[1][1] - M[0][1] * M[1][0];
        }
        else {
            var d = 0;
            for (var i = 0; i < n; i++) {
                // create a sub matrix
                var subMatrix = [];
                for (var r = 0; r < n; r++) {
                    subMatrix.push([]);
                    for (var c = 0; c < n; c++) {
                        if (c != i) {
                            subMatrix[r].push(this.matrix[r][c]);
                        }
                    }
                }
                d += M[0][i] * new Matrix(subMatrix).determinant();
            }
            return d;
        }
    };
    Matrix.prototype.subMatrix = function (startRow, endRow, startCol, endCol) {
        if (endRow === void 0) { endRow = this.dimR - 1; }
        if (endCol === void 0) { endCol = this.dimC - 1; }
        var arr = new Array();
        for (var i = startRow; i <= endRow; i++) {
            arr.push([]);
            for (var j = startCol; j <= endCol; j++) {
                arr[i].push(this.matrix[i][j]);
            }
        }
        return new Matrix(arr);
    };
    Matrix.prototype.toString = function () {
        var m = this.matrix;
        var str = "";
        if (m.length == 1) {
            str += "< ";
            for (var i = 0; i < this.dimC; i++) {
                str += m[0][i];
                if (i != m[0].length - 1) {
                    str += " ";
                }
            }
            str += " >";
        }
        else {
            str += "[";
            for (var i = 0; i < this.dimR; i++) {
                if (i != 0) {
                    str += " ";
                }
                str += "[ ";
                for (var j = 0; j < this.dimC; j++) {
                    str += m[i][j] + " ";
                }
                str += "]";
                if (i != this.dimR - 1) {
                    str += "\n";
                }
            }
            str += "]";
            str += "  { " + this.dimR + " x " + this.dimC + " }";
        }
        return str;
    };
    return Matrix;
}(_1.Computable));
exports.Matrix = Matrix;
function isMatrix(el) {
    return el instanceof Matrix;
}
exports.isMatrix = isMatrix;
//# sourceMappingURL=matrix.js.map