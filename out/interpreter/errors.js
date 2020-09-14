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
exports.ArgumentError = exports.UndeclaredVariableError = exports.ParsingError = exports.MatrixError = exports.ArithmeticError = exports.SymbolError = exports.SyntaxError = void 0;
var SyntaxError = /** @class */ (function (_super) {
    __extends(SyntaxError, _super);
    function SyntaxError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "TokenError";
        return _this;
    }
    return SyntaxError;
}(Error));
exports.SyntaxError = SyntaxError;
var SymbolError = /** @class */ (function (_super) {
    __extends(SymbolError, _super);
    function SymbolError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "SymbolError";
        return _this;
    }
    return SymbolError;
}(Error));
exports.SymbolError = SymbolError;
var ArithmeticError = /** @class */ (function (_super) {
    __extends(ArithmeticError, _super);
    function ArithmeticError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "ArithmeticError";
        return _this;
    }
    return ArithmeticError;
}(Error));
exports.ArithmeticError = ArithmeticError;
var MatrixError = /** @class */ (function (_super) {
    __extends(MatrixError, _super);
    function MatrixError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "MatrixError";
        return _this;
    }
    return MatrixError;
}(Error));
exports.MatrixError = MatrixError;
var ParsingError = /** @class */ (function (_super) {
    __extends(ParsingError, _super);
    function ParsingError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "ParsingError";
        return _this;
    }
    return ParsingError;
}(Error));
exports.ParsingError = ParsingError;
var UndeclaredVariableError = /** @class */ (function (_super) {
    __extends(UndeclaredVariableError, _super);
    function UndeclaredVariableError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "UndeclaredVariableError";
        return _this;
    }
    return UndeclaredVariableError;
}(Error));
exports.UndeclaredVariableError = UndeclaredVariableError;
var ArgumentError = /** @class */ (function (_super) {
    __extends(ArgumentError, _super);
    function ArgumentError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "ArgumentError";
        return _this;
    }
    return ArgumentError;
}(Error));
exports.ArgumentError = ArgumentError;
//# sourceMappingURL=errors.js.map