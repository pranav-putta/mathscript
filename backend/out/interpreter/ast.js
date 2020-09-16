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
exports.isComputableNode = exports.UnaryOperatorNode = exports.SingleValueNode = exports.VariableNode = exports.BinaryOperatorNode = exports.ComputableNode = exports.EmptyNode = exports.ProcedureNode = exports.AssignNode = exports.CompoundNode = exports.AbstractSyntaxTree = void 0;
var global_1 = require("./global");
var computable_1 = require("./computable");
var errors_1 = require("./errors");
var token_1 = require("./token");
var matrix_1 = require("./computable/matrix");
/**
 * abstract syntax tree base class
 */
var AbstractSyntaxTree = /** @class */ (function () {
    function AbstractSyntaxTree() {
    }
    return AbstractSyntaxTree;
}());
exports.AbstractSyntaxTree = AbstractSyntaxTree;
/**
 * compound statements go here
 */
var CompoundNode = /** @class */ (function (_super) {
    __extends(CompoundNode, _super);
    function CompoundNode(nodes) {
        if (nodes === void 0) { nodes = []; }
        var _this = _super.call(this) || this;
        _this.children = nodes;
        return _this;
    }
    CompoundNode.prototype.eval = function () {
        var results = [];
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var val = child.eval();
            results.push(val);
        }
        return results;
    };
    return CompoundNode;
}(AbstractSyntaxTree));
exports.CompoundNode = CompoundNode;
/**
 * assigns a variable to its value
 */
var AssignNode = /** @class */ (function (_super) {
    __extends(AssignNode, _super);
    function AssignNode(left, token, right) {
        var _this = _super.call(this) || this;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    AssignNode.prototype.eval = function () {
        var name = this.left.value;
        var val = this.right.eval();
        global_1.global_scope[name] = val;
        return name + " = " + global_1.global_scope[name];
    };
    return AssignNode;
}(AbstractSyntaxTree));
exports.AssignNode = AssignNode;
/**
 * computes a procedure
 */
var ProcedureNode = /** @class */ (function (_super) {
    __extends(ProcedureNode, _super);
    function ProcedureNode(token, args) {
        var _this = _super.call(this) || this;
        _this.name = token.value;
        _this.args = args;
        return _this;
    }
    ProcedureNode.prototype.eval = function () {
        var func = global_1.global_functions[this.name];
        var result = func.apply(this, this.args);
        console.log(result);
        return result;
    };
    return ProcedureNode;
}(AbstractSyntaxTree));
exports.ProcedureNode = ProcedureNode;
/**
 * empty node, doesn't do anything
 */
var EmptyNode = /** @class */ (function (_super) {
    __extends(EmptyNode, _super);
    function EmptyNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EmptyNode.prototype.eval = function () {
        return;
    };
    return EmptyNode;
}(AbstractSyntaxTree));
exports.EmptyNode = EmptyNode;
/**
 * node that returns a computable value when evaluated
 */
var ComputableNode = /** @class */ (function (_super) {
    __extends(ComputableNode, _super);
    function ComputableNode() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ComputableNode;
}(AbstractSyntaxTree));
exports.ComputableNode = ComputableNode;
/**
 * binary operator node
 * takes a (left, operator, right)
 */
var BinaryOperatorNode = /** @class */ (function (_super) {
    __extends(BinaryOperatorNode, _super);
    function BinaryOperatorNode(left, operator, right) {
        var _this = _super.call(this) || this;
        _this.left = left;
        _this.right = right;
        _this.operator = operator;
        return _this;
    }
    BinaryOperatorNode.prototype.eval = function () {
        var l = this.left.eval();
        var r = this.right.eval();
        if (computable_1.isComputable(l) && computable_1.isComputable(r)) {
            return computable_1.Computable.compute(l, r, this.operator.type).result;
        }
        throw new errors_1.ParsingError("cannot operate on two non-computable values: " + l + " and " + r);
    };
    return BinaryOperatorNode;
}(ComputableNode));
exports.BinaryOperatorNode = BinaryOperatorNode;
/**
 * holds a variable and its value
 */
var VariableNode = /** @class */ (function (_super) {
    __extends(VariableNode, _super);
    function VariableNode(token) {
        var _this = _super.call(this) || this;
        _this._value = token.value;
        return _this;
    }
    Object.defineProperty(VariableNode.prototype, "value", {
        get: function () {
            return this._value;
        },
        enumerable: false,
        configurable: true
    });
    VariableNode.prototype.eval = function () {
        var name = this.value;
        var val = global_1.global_scope[name];
        if (val) {
            console.log(name + " = " + val);
            return val;
        }
        else {
            throw new errors_1.UndeclaredVariableError(name + " was not declared!");
        }
    };
    return VariableNode;
}(ComputableNode));
exports.VariableNode = VariableNode;
/**
 * stores a single value: number or matrix
 */
var SingleValueNode = /** @class */ (function (_super) {
    __extends(SingleValueNode, _super);
    function SingleValueNode(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    SingleValueNode.prototype.eval = function () {
        // evaluate unevaluated matrix if not done already
        if (matrix_1.UnevaluatedMatrix.isUnevaluatedMatrix(this.value)) {
            this.value = this.value.evaluate();
        }
        return this.value;
    };
    return SingleValueNode;
}(ComputableNode));
exports.SingleValueNode = SingleValueNode;
/**
 * holds a unary operator
 */
var UnaryOperatorNode = /** @class */ (function (_super) {
    __extends(UnaryOperatorNode, _super);
    function UnaryOperatorNode(token, next) {
        var _this = _super.call(this) || this;
        _this.token = token;
        _this.next = next;
        return _this;
    }
    UnaryOperatorNode.prototype.eval = function () {
        if (this.token.type == token_1.TokenType.plus) {
            return this.next.eval();
        }
        else if (this.token.type == token_1.TokenType.minus) {
            return this.next.eval().mul(new computable_1.Numeric(-1)).result;
        }
        else {
            throw new errors_1.SymbolError("unexpected unary operator: " + this.token.type.toString());
        }
    };
    return UnaryOperatorNode;
}(ComputableNode));
exports.UnaryOperatorNode = UnaryOperatorNode;
function isComputableNode(node) {
    return node instanceof ComputableNode;
}
exports.isComputableNode = isComputableNode;
//# sourceMappingURL=ast.js.map