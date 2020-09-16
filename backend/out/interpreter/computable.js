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
exports.Matrix = exports.AComputable = void 0;
var errors_1 = require("./errors");
var AComputable = /** @class */ (function () {
    function AComputable() {
    }
    /**
     * checks if given element is of type matrix
     * @param el any element
     */
    AComputable.isMatrix = function (el) {
        return el instanceof Matrix;
    };
    /**
     * checks if given element is of type number
     * @param el any element
     */
    AComputable.isNumeric = function (el) {
        return typeof el === "number";
    };
    /**
     * checks if given element is of type computable
     * @param el any element
     */
    AComputable.isComputable = function (el) {
        return el instanceof AComputable || typeof el === "number";
    };
    return AComputable;
}());
exports.AComputable = AComputable;
var Matrix = /** @class */ (function (_super) {
    __extends(Matrix, _super);
    function Matrix(nodes, rows) {
        if (nodes === void 0) { nodes = new Array(); }
        if (rows === void 0) { rows = undefined; }
        var _this = _super.call(this) || this;
        if (!rows) {
            // raw node matrix
            _this.nodes = nodes;
            _this.rows = undefined;
            _this.dimR = nodes.length;
            _this.dimC = _this.dimR > 0 ? nodes[0].length : 0;
            // verify each row is the same length
            for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                var row = nodes_1[_i];
                if (row.length != _this.dimC) {
                    throw new errors_1.MatrixError("row dimensions did not match");
                }
            }
        }
        else {
            // populate matrix with numbers
            _this.nodes = new Array();
            _this.rows = rows;
            _this.dimR = rows.length;
            _this.dimC = _this.dimR > 0 ? rows[0].length : 0;
            // verify each row is the same length
            for (var _a = 0, rows_1 = rows; _a < rows_1.length; _a++) {
                var row = rows_1[_a];
                if (row.length != _this.dimC) {
                    throw new errors_1.MatrixError("row dimensions did not match");
                }
            }
        }
        return _this;
    }
    Matrix.prototype.checkDimensions = function (other) {
        if (this.dimR != other.dimR || this.dimC != other.dimC) {
            throw new errors_1.MatrixError("can't add matricies of different dimensions! (" + this.dimR + " x " + this.dimC + ") and (" + other.dimR + " x " + other.dimC + ")");
        }
    };
    /**
     * add two matricies together by elementwise addition or add a constant to the matrix
     * @param other a computable object
     */
    Matrix.prototype.add = function (other) {
        if (this.rows) {
            var arr = new Array();
            if (AComputable.isMatrix(other) && other.rows) {
                // add two matricies together
                this.checkDimensions(other);
                for (var i = 0; i < this.dimR; i++) {
                    arr.push([]);
                    for (var j = 0; j < this.dimC; j++) {
                        arr[i].push(this.rows[i][j] + other.rows[i][j]);
                    }
                }
            }
            else if (AComputable.isNumeric(other)) {
                // add constant to each element
                for (var i = 0; i < this.dimR; i++) {
                    arr.push([]);
                    for (var j = 0; j < this.dimC; j++) {
                        arr[i].push(this.rows[i][j] + other);
                    }
                }
            }
            return { result: new Matrix(undefined, arr) };
        }
        throw new errors_1.ParsingError("matrix has not been evaluated yet.");
    };
    /**
     * subtracts matrix from this, or subtracts constant from each element
     * @param other any computable item
     */
    Matrix.prototype.sub = function (other) {
        if (this.rows) {
            var arr = new Array();
            if (AComputable.isMatrix(other) && other.rows) {
                // subtract two matricies together
                this.checkDimensions(other);
                for (var i = 0; i < this.dimR; i++) {
                    arr.push([]);
                    for (var j = 0; j < this.dimC; j++) {
                        arr[i].push(this.rows[i][j] - other.rows[i][j]);
                    }
                }
            }
            else if (AComputable.isNumeric(other)) {
                // subtract constant to each element
                for (var i = 0; i < this.dimR; i++) {
                    arr.push([]);
                    for (var j = 0; j < this.dimC; j++) {
                        arr[i].push(this.rows[i][j] - other);
                    }
                }
            }
            return { result: new Matrix(undefined, arr) };
        }
        throw new errors_1.ParsingError("matrix has not been evaluated yet.");
    };
    /**
     * element-wise multiplication
     * @param other
     */
    Matrix.prototype.el_mul = function (other) {
        if (this.rows && other.rows) {
            if (this.dimC == other.dimC && this.dimR == other.dimR) {
                var arr = new Array();
                for (var i = 0; i < this.dimR; i++) {
                    arr.push([]);
                    for (var j = 0; j < this.dimC; j++) {
                        arr[i].push(this.rows[i][j] * other.rows[i][j]);
                    }
                }
                return { result: new Matrix(undefined, arr) };
            }
            else {
                throw new errors_1.MatrixError("cannot do element-wise multiplication on different sized matricies");
            }
        }
        throw new errors_1.ParsingError("matrix hasn't been evaulated yet!");
    };
    /**
     * computes the matrix product or multiplies a matrix by a scalar
     * @param other any computable item
     */
    Matrix.prototype.mul = function (other) {
        if (this.rows) {
            if (AComputable.isMatrix(other)) {
                if (other.rows) {
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
                                temp += this.rows[i][k] * other.rows[k][j];
                            }
                            newMatrix[i].push(temp);
                        }
                    }
                    if (newMatrix.length == 1 && newMatrix[0].length == 1) {
                        return { result: newMatrix[0][0] };
                    }
                    else {
                        return { result: new Matrix(undefined, newMatrix) };
                    }
                }
            }
            else if (AComputable.isNumeric(other)) {
                var arr = new Array();
                // multiply constant to each element
                for (var i = 0; i < this.dimR; i++) {
                    arr.push([]);
                    for (var j = 0; j < this.dimC; j++) {
                        arr[i].push(this.rows[i][j] * other);
                    }
                }
                return { result: new Matrix(undefined, arr) };
            }
            else {
                throw new errors_1.MatrixError("couldn't multiply with a " + other);
            }
        }
        throw new errors_1.ParsingError("matrix has not been evaluated yet.");
    };
    /**
     * divide by a scalar, matrix division is not supported
     * @param other
     */
    Matrix.prototype.div = function (other) {
        if (this.rows) {
            if (AComputable.isNumeric(other)) {
                var arr = new Array();
                // multiply constant to each element
                for (var i = 0; i < this.dimR; i++) {
                    arr.push([]);
                    for (var j = 0; j < this.dimC; j++) {
                        arr[i].push(this.rows[i][j] / other);
                    }
                }
                return { result: new Matrix(undefined, arr) };
            }
            throw new errors_1.MatrixError("matrix division is not supported.");
        }
        throw new errors_1.ParsingError("matrix has not been evaluated yet.");
    };
    /**
     * divide by a scalar, matrix division is not supported
     * @param other
     */
    Matrix.prototype.rdiv = function (other) {
        if (this.rows) {
            if (AComputable.isNumeric(other)) {
                var arr = new Array();
                // multiply constant to each element
                for (var i = 0; i < this.dimR; i++) {
                    arr.push([]);
                    for (var j = 0; j < this.dimC; j++) {
                        arr[i].push(Math.floor(this.rows[i][j] / other));
                    }
                }
                return { result: new Matrix(undefined, arr) };
            }
            throw new errors_1.MatrixError("matrix division is not supported.");
        }
        throw new errors_1.ParsingError("matrix has not been evaluated yet.");
    };
    /**
     * take power
     * @param other
     */
    Matrix.prototype.pow = function (other) {
        if (this.rows) {
            if (AComputable.isNumeric(other)) {
                var newMatrix = this;
                for (var i = 0; i < other; i++) {
                    var tmp = newMatrix.mul(this).result;
                    if (AComputable.isMatrix(tmp)) {
                        newMatrix = tmp;
                    }
                    else {
                        throw new errors_1.MatrixError("somethin happened bruh.");
                    }
                }
                return { result: newMatrix };
            }
            else {
                throw new errors_1.MatrixError("matrix power is not supported");
            }
        }
        throw new errors_1.ParsingError("matrix has not been evaluated yet.");
    };
    /**
     * evaluates matrix from raw nodes
     */
    Matrix.prototype.evaluate = function () {
        if (!this.rows) {
            var arr = new Array();
            for (var row = 0; row < this.dimR; row++) {
                arr.push([]);
                for (var col = 0; col < this.dimC; col++) {
                    var val = this.nodes[row][col].eval();
                    if (AComputable.isNumeric(val)) {
                        arr[row].push(val);
                    }
                    else {
                        throw new SyntaxError("couldn't evaluate matrix! expected numbers.");
                    }
                }
            }
            this.rows = arr;
        }
    };
    Matrix.prototype.transpose = function (save) {
        if (save === void 0) { save = false; }
        if (this.rows) {
            var arr = new Array();
            for (var i = 0; i < this.dimC; i++) {
                arr.push([]);
                for (var j = 0; j < this.dimR; j++) {
                    arr[i].push(this.rows[j][i]);
                }
            }
            if (save) {
                this.rows = arr;
                var tmp = this.dimR;
                this.dimR = this.dimC;
                this.dimC = tmp;
                return { result: this };
            }
            return { result: new Matrix(undefined, arr) };
        }
        throw new errors_1.ParsingError("matrix has not been evaluated yet!");
    };
    Matrix.prototype.toString = function () {
        var str = this.dimR + " x " + this.dimC + "\n";
        str += JSON.stringify(this.rows);
        return str;
    };
    return Matrix;
}(AComputable));
exports.Matrix = Matrix;
//# sourceMappingURL=computable.js.map