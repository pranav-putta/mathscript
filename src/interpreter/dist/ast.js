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
exports.__esModule = true;
exports.isComputableNode = exports.util = exports.UnaryOperatorNode = exports.SingleValueNode = exports.VariableNode = exports.BinaryOperatorNode = exports.ComputableNode = exports.EmptyNode = exports.ProcedureNode = exports.AssignNode = exports.CompoundNode = exports.AbstractSyntaxTree = void 0;
var global_1 = require("./global");
var computable_1 = require("./computable");
var errors_1 = require("./errors");
var token_1 = require("./token");
var util_1 = require("./util");
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
    function CompoundNode() {
        var _this = _super.call(this) || this;
        _this.children = [];
        return _this;
    }
    CompoundNode.prototype.eval = function () {
        var results = [];
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var val = child.eval();
            results.push(val);
        }
    };
    Object.defineProperty(CompoundNode.prototype, "_children", {
        get: function () {
            return this.children;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CompoundNode.prototype, "_node_value_string", {
        get: function () {
            return "compound";
        },
        enumerable: false,
        configurable: true
    });
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
        _this.token = token;
        _this.right = right;
        return _this;
    }
    AssignNode.prototype.eval = function () {
        var name = this.left.value;
        global_1.global_scope[name] = this.right.eval();
        console.log(name + " = " + global_1.global_scope[name]);
    };
    Object.defineProperty(AssignNode.prototype, "_children", {
        get: function () {
            return [this.left, this.right];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AssignNode.prototype, "_node_value_string", {
        get: function () {
            return "=";
        },
        enumerable: false,
        configurable: true
    });
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
        _this.token = token;
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
    Object.defineProperty(ProcedureNode.prototype, "_children", {
        get: function () {
            throw new Error("Method not implemented.");
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProcedureNode.prototype, "_node_value_string", {
        get: function () {
            throw new Error("Method not implemented.");
        },
        enumerable: false,
        configurable: true
    });
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
    Object.defineProperty(EmptyNode.prototype, "_children", {
        get: function () {
            return [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(EmptyNode.prototype, "_node_value_string", {
        get: function () {
            return "empty node";
        },
        enumerable: false,
        configurable: true
    });
    return EmptyNode;
}(AbstractSyntaxTree));
exports.EmptyNode = EmptyNode;
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
    // TODO: simplify commutative process
    BinaryOperatorNode.prototype.eval = function () {
        var l = this.left.eval();
        var r = this.right.eval();
        var result;
        if (computable_1.AComputable.isComputable(l) && computable_1.AComputable.isComputable(r)) {
            if (this.operator.type == token_1.TokenType.plus) {
                if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isNumeric(r)) {
                    result = { result: l + r };
                }
                else if (computable_1.AComputable.isMatrix(l) &&
                    (computable_1.AComputable.isNumeric(r) || computable_1.AComputable.isMatrix(r))) {
                    result = l.add(r);
                }
                else if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isMatrix(r)) {
                    result = r.add(l);
                }
            }
            else if (this.operator.type == token_1.TokenType.minus) {
                if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isNumeric(r)) {
                    result = { result: l - r };
                }
                else if (computable_1.AComputable.isMatrix(l) &&
                    (computable_1.AComputable.isNumeric(r) || computable_1.AComputable.isMatrix(r))) {
                    result = l.sub(r);
                }
                else if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isMatrix(r)) {
                    var tmp = r.mul(-1).result;
                    if (computable_1.AComputable.isMatrix(tmp)) {
                        result = tmp.add(r);
                    }
                    else {
                        throw new errors_1.MatrixError("ummm... something went wrong");
                    }
                }
            }
            else if (this.operator.type == token_1.TokenType.mul) {
                if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isNumeric(r)) {
                    result = { result: l * r };
                }
                else if (computable_1.AComputable.isMatrix(l) &&
                    (computable_1.AComputable.isNumeric(r) || computable_1.AComputable.isMatrix(r))) {
                    result = l.mul(r);
                }
                else if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isMatrix(r)) {
                    result = r.mul(l);
                }
            }
            else if (this.operator.type == token_1.TokenType.div) {
                if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isNumeric(r)) {
                    result = { result: l / r };
                }
                else if (computable_1.AComputable.isMatrix(l) &&
                    (computable_1.AComputable.isNumeric(r) || computable_1.AComputable.isMatrix(r))) {
                    result = l.div(r);
                }
                else if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isMatrix(r)) {
                    result = r.div(l);
                }
            }
            else if (this.operator.type == token_1.TokenType.rdiv) {
                if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isNumeric(r)) {
                    result = { result: Math.floor(l / r) };
                }
                else if (computable_1.AComputable.isMatrix(l) &&
                    (computable_1.AComputable.isNumeric(r) || computable_1.AComputable.isMatrix(r))) {
                    result = l.rdiv(r);
                }
                else if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isMatrix(r)) {
                    result = r.rdiv(l);
                }
            }
            else if (this.operator.type == token_1.TokenType.pow) {
                if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isNumeric(r)) {
                    result = { result: Math.pow(l, r) };
                }
                else if (computable_1.AComputable.isMatrix(l) &&
                    (computable_1.AComputable.isNumeric(r) || computable_1.AComputable.isMatrix(r))) {
                    result = l.pow(r);
                }
                else if (computable_1.AComputable.isNumeric(l) && computable_1.AComputable.isMatrix(r)) {
                    result = r.pow(l);
                }
            }
        }
        if (result === null || result === void 0 ? void 0 : result.message) {
            console.log(result === null || result === void 0 ? void 0 : result.message);
        }
        console.log(result === null || result === void 0 ? void 0 : result.result.toString());
        return result === null || result === void 0 ? void 0 : result.result;
    };
    Object.defineProperty(BinaryOperatorNode.prototype, "_children", {
        get: function () {
            return [this.left, this.right];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BinaryOperatorNode.prototype, "_node_value_string", {
        get: function () {
            return this.operator.type.toString();
        },
        enumerable: false,
        configurable: true
    });
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
        _this.token = token;
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
    Object.defineProperty(VariableNode.prototype, "_children", {
        get: function () {
            return [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VariableNode.prototype, "_node_value_string", {
        get: function () {
            throw new Error("Method not implemented.");
        },
        enumerable: false,
        configurable: true
    });
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
        if (computable_1.AComputable.isNumeric(this.value)) {
            return this.value;
        }
        else if (computable_1.AComputable.isMatrix(this.value)) {
            this.value.evaluate();
            return this.value;
        }
        else {
            throw new SyntaxError("invalid single value node!");
        }
    };
    Object.defineProperty(SingleValueNode.prototype, "_children", {
        get: function () {
            return [];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SingleValueNode.prototype, "_node_value_string", {
        get: function () {
            return this.value.toString();
        },
        enumerable: false,
        configurable: true
    });
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
            // return next element as is
            return this.next.eval();
        }
        else if (this.token.type == token_1.TokenType.minus) {
            // take negation of next element
            var out = this.next.eval();
            if (computable_1.AComputable.isNumeric(out)) {
                return -1 * out;
            }
            else if (computable_1.AComputable.isMatrix(out)) {
                return out.mul(-1).result;
            }
            else {
                throw new errors_1.ArithmeticError("couldn't evaluate negation of item");
            }
        }
        else {
            throw new errors_1.SymbolError("unexpected unary operator: " + this.token.type.toString());
        }
    };
    Object.defineProperty(UnaryOperatorNode.prototype, "_children", {
        get: function () {
            return [this.next];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(UnaryOperatorNode.prototype, "_node_value_string", {
        get: function () {
            return this.token.type.toString();
        },
        enumerable: false,
        configurable: true
    });
    return UnaryOperatorNode;
}(ComputableNode));
exports.UnaryOperatorNode = UnaryOperatorNode;
var util;
(function (util) {
    function printTreeLevelOrder(tree) {
        var queue = new util_1.Queue();
        var currentLevel = 0;
        var str = "";
        var arrows = "";
        var space = " ";
        var extraspace = "  ";
        // initialize first element
        var node = {
            node: tree,
            level: currentLevel,
            strLength: 0
        };
        // continue until node is null
        while (node) {
            if (node.level > currentLevel) {
                process.stdout.write(str);
                process.stdout.write("\n" + arrows + "\n");
                str = "";
                arrows = "";
                currentLevel = node.level;
            }
            var children = node.node._children;
            switch (children.length) {
                case 0:
                    arrows += "   ";
                    break;
                case 1:
                    while (arrows.length < node.strLength) {
                        arrows += " ";
                    }
                    arrows += "|" + space;
                    break;
                case 2:
                    while (arrows.length < node.strLength) {
                        arrows += " ";
                    }
                    arrows += "|" + space + "\\" + extraspace;
                    break;
            }
            while (str.length < (node === null || node === void 0 ? void 0 : node.strLength)) {
                str += " ";
            }
            for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var x = children_1[_i];
                queue.push({ node: x, level: node.level + 1, strLength: str.length });
            }
            str += node.node._node_value_string + extraspace;
            // dequeue next element
            node = queue.pop();
        }
        process.stdout.write(str);
        process.stdout.write("\n");
    }
    util.printTreeLevelOrder = printTreeLevelOrder;
})(util = exports.util || (exports.util = {}));
function isComputableNode(node) {
    return node instanceof ComputableNode;
}
exports.isComputableNode = isComputableNode;
