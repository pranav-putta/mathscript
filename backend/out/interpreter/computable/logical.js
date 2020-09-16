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
exports.isLogical = exports.Logical = void 0;
var errors_1 = require("../errors");
var numeric_1 = require("./numeric");
/**
 * boolean computable value
 */
var Logical = /** @class */ (function (_super) {
    __extends(Logical, _super);
    function Logical(value) {
        var _this = _super.call(this, value ? 1 : 0) || this;
        _this.boolVal = value;
        return _this;
    }
    Logical.prototype.add = function (other) {
        return other.add(new numeric_1.Numeric(this.value));
    };
    Logical.prototype.sub = function (other) {
        return other.add(new numeric_1.Numeric(this.value * -1));
    };
    Logical.prototype.mul = function (other) {
        return other.mul(new numeric_1.Numeric(this.value));
    };
    Logical.prototype.div = function (other) {
        throw new errors_1.ArithmeticError("boolean division is not supported");
    };
    Logical.prototype.rdiv = function (other) {
        throw new errors_1.ArithmeticError("boolean division is not supported");
    };
    Logical.prototype.pow = function (other) {
        throw new errors_1.ArithmeticError("boolean powers not supported");
    };
    Logical.prototype.or = function (other) {
        return { result: new Logical(this.boolVal || other.boolVal) };
    };
    Logical.prototype.and = function (other) {
        return { result: new Logical(this.boolVal && other.boolVal) };
    };
    Logical.prototype.xor = function (other) {
        return { result: new Logical(this.boolVal !== other.boolVal) };
    };
    Logical.prototype.nand = function (other) {
        return {
            result: new Logical(this.boolVal == other.boolVal && !this.boolVal),
        };
    };
    return Logical;
}(numeric_1.Numeric));
exports.Logical = Logical;
function isLogical(el) {
    return el instanceof Logical;
}
exports.isLogical = isLogical;
//# sourceMappingURL=logical.js.map