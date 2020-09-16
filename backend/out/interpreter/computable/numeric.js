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
exports.isNumeric = exports.Numeric = void 0;
var _1 = require("./");
var errors_1 = require("../errors");
var Numeric = /** @class */ (function (_super) {
    __extends(Numeric, _super);
    function Numeric(val) {
        var _this = _super.call(this) || this;
        _this.value = val;
        return _this;
    }
    Numeric.prototype.error = function () {
        throw new errors_1.ArithmeticError("cannot add numeric with non-numeric");
    };
    Numeric.prototype.add = function (other) {
        if (isNumeric(other)) {
            return { result: new Numeric(this.value + other.value) };
        }
        else if (_1.isMatrix(other)) {
            return other.add(this);
        }
        this.error();
    };
    Numeric.prototype.sub = function (other) {
        if (isNumeric(other)) {
            return { result: new Numeric(this.value - other.value) };
        }
        else if (_1.isMatrix(other)) {
            return other.sub(this);
        }
        this.error();
    };
    Numeric.prototype.mul = function (other) {
        if (isNumeric(other)) {
            return { result: new Numeric(this.value * other.value) };
        }
        else if (_1.isMatrix(other)) {
            return other.mul(this);
        }
        this.error();
    };
    Numeric.prototype.div = function (other) {
        if (isNumeric(other)) {
            return { result: new Numeric(this.value / other.value) };
        }
        else if (_1.isMatrix(other)) {
            return other.div(this);
        }
        this.error();
    };
    Numeric.prototype.rdiv = function (other) {
        if (isNumeric(other)) {
            return { result: new Numeric(Math.floor(this.value / other.value)) };
        }
        else if (_1.isMatrix(other)) {
            return other.rdiv(this);
        }
        this.error();
    };
    Numeric.prototype.pow = function (other) {
        if (isNumeric(other)) {
            return { result: new Numeric(Math.pow(this.value, other.value)) };
        }
        this.error();
    };
    return Numeric;
}(_1.Computable));
exports.Numeric = Numeric;
function isNumeric(el) {
    return el instanceof Numeric;
}
exports.isNumeric = isNumeric;
//# sourceMappingURL=numeric.js.map