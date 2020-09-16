"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isComputable = exports.Computable = void 0;
var errors_1 = require("../errors");
var token_1 = require("../token");
var Computable = /** @class */ (function () {
    function Computable() {
    }
    Computable.compute = function (a, b, operator) {
        switch (operator) {
            case token_1.TokenType.plus:
                return a.add(b);
            case token_1.TokenType.minus:
                return a.sub(b);
            case token_1.TokenType.mul:
                return a.mul(b);
            case token_1.TokenType.div:
                return a.div(b);
            case token_1.TokenType.rdiv:
                return a.rdiv(b);
            default:
                throw new errors_1.ArithmeticError("unsupported operation: " + operator);
        }
    };
    return Computable;
}());
exports.Computable = Computable;
/**
 * checks if given element is of type computable
 * @param el any element
 */
function isComputable(el) {
    return el instanceof Computable;
}
exports.isComputable = isComputable;
var matrix_1 = require("./matrix");
Object.defineProperty(exports, "Matrix", { enumerable: true, get: function () { return matrix_1.Matrix; } });
Object.defineProperty(exports, "UnevaluatedMatrix", { enumerable: true, get: function () { return matrix_1.UnevaluatedMatrix; } });
Object.defineProperty(exports, "isMatrix", { enumerable: true, get: function () { return matrix_1.isMatrix; } });
var numeric_1 = require("./numeric");
Object.defineProperty(exports, "Numeric", { enumerable: true, get: function () { return numeric_1.Numeric; } });
Object.defineProperty(exports, "isNumeric", { enumerable: true, get: function () { return numeric_1.isNumeric; } });
var logical_1 = require("./logical");
Object.defineProperty(exports, "Logical", { enumerable: true, get: function () { return logical_1.Logical; } });
Object.defineProperty(exports, "isLogical", { enumerable: true, get: function () { return logical_1.isLogical; } });
//# sourceMappingURL=index.js.map