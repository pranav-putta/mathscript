"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Matrix = void 0;
var errors_1 = require("./errors");
var Matrix = /** @class */ (function () {
    function Matrix(rows) {
        this.rows = rows;
        this.dimR = rows.length;
        this.dimC = this.dimR > 0 ? rows[0].length : 0;
        // verify each row is the same length
        for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
            var row = rows_1[_i];
            if (row.length != this.dimC) {
                throw new errors_1.MatrixError("row dimensions did not match");
            }
        }
    }
    Matrix.prototype.addConstant = function (c) {
        for (var i = 0; i < this.dimR; i++) {
            for (var j = 0; j < this.dimC; j++) {
                this.rows[i][j] = add(this.rows[i][j], c);
            }
        }
        return this;
    };
    Matrix.prototype.add = function (c) {
        if (this.dimR != c.dimR || this.dimC != c.dimC) {
            throw new errors_1.MatrixError("can't add matricies of different dimensions! (" + this.dimR + " x " + this.dimC + ") and (" + c.dimR + " x " + c.dimC + ")");
        }
        for (var i = 0; i < this.dimR; i++) {
            for (var j = 0; j < this.dimC; j++) {
                this.rows[i][j] = add(this.rows[i][j], c.rows[i][j]);
            }
        }
    };
    Matrix.prototype.toString = function () {
        var str = this.dimR + " x " + this.dimC + "\n";
        str += this.rows.toString();
        return str;
    };
    return Matrix;
}());
exports.Matrix = Matrix;
//# sourceMappingURL=matrix.js.map