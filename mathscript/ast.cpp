//
// Created by Pranav Putta on 9/20/20.
//

#include "ast.h"

#include <utility>
#include "errors.h"
#include "token.h"

using namespace std;

/**
 * evaluates each statement in children
 * @param table
 * @return
 */
Result CompoundNode::eval(SymTable &table) {
    vector<ObjPtr> results;
    for (const ASTPtr &child : children) {
        Result result = child->eval(table);
        if (result.type == Result::Type::kSingle) {
            results.push_back(get<ObjPtr>(result.data));
        } else if (result.type == Result::Type::kCompound) {
            auto arr = get<vector<ObjPtr >>(result.data);
            results.insert(results.end(), arr.begin(), arr.end());
        }
    }
    return Result{Result::Type::kCompound, results};
}

/**
 * retrieves variable name from symbol table
 * @param table
 * @return
 */
Result VariableNode::eval(SymTable &table) {
    ObjPtr var = table.FindVariable(name);
    return Result{Result::Type::kSingle, var};
}

/**
 * constructs variable node
 * @param name
 */
VariableNode::VariableNode(std::string name) : name(std::move(name)) {
}

/**
 * create variable in symbol table
 * @param table
 * @return
 */
Result AssignmentNode::eval(SymTable &table) {
    Result next = right->eval(table);
    if (next.type == Result::Type::kSingle) {
        table.AssignVariable(left->name, get<ObjPtr>(next.data));
        return next;
    }
    throw EvaluationError("assignment requires a value");
}

/**
 * constructs assignment node
 * @param l
 * @param right
 */
AssignmentNode::AssignmentNode(std::shared_ptr<VariableNode> l, ASTPtr right) : left(std::move(l)),
                                                                                right(std::move(right)) {}

/**
 * calls a function definition in symbol table
 * @param table
 * @return
 */
Result FunctionCallNode::eval(SymTable &table) {
    // evaluate arguments
    vector<ObjPtr> args;
    for (const auto &rawArg: arguments) {
        args.push_back(get<ObjPtr>(rawArg->eval(table).data));
    }
    return table.ExecuteFunction(name, args);
}

/**
 * constructs a function call node
 * @param name
 * @param args
 */
FunctionCallNode::FunctionCallNode(std::string name, std::vector<ASTPtr> args) : name(std::move(name)),
                                                                                 arguments(std::move(args)) {}

/**
 * creates a function in symbol table
 * @param table
 * @return
 */
Result FunctionDefinitionNode::eval(SymTable &table) {
    table.CreateFunction(name, params, statements);
    return Result{Result::Type::kNone, std::monostate()};
}

/**
 * constructs new function definition node
 * @param name
 * @param params
 * @param statements
 */
FunctionDefinitionNode::FunctionDefinitionNode(std::string name, std::vector<std::shared_ptr<VariableNode>> params,
                                               std::shared_ptr<CompoundNode> statements) : name(std::move(name)),
                                                                                           params(std::move(params)),
                                                                                           statements(std::movestatements)) {}
/**
 * returns empty node
 * @param table
 * @return
 */
Result EmptyNode::eval(SymTable &table) {
    return Result{Result::Type::kNone, std::monostate()};
}

/**
 * computes binary operation
 * @param table
 * @return
 */
Result BinaryOperatorNode::eval(SymTable &table) {
    Result l = left->eval(table);
    Result r = right->eval(table);

    if (l.type != Result::Type::kSingle || r.type != Result::Type::kSingle) {
        throw EvaluationError("binary operation failed. needs two operands");
    }

    auto a = dynamic_cast<PrimitiveType *>(get<ObjPtr>(l.data).get());
    auto b = dynamic_cast<PrimitiveType *>(get<ObjPtr>(r.data).get());
    if (!a || !b) {
        throw EvaluationError("binary operation failed. need two computable objects");
    }
    PrimitivePtr out;
    switch (op.type) {
        case TokenType::kPlus:
            out = *a + *b;
            break;
        case TokenType::kMinus:
            out = *a - *b;
            break;
        case TokenType::kMul:
            out = *a * *b;
            break;
        case TokenType::kDiv:
            out = *a / *b;
            break;
        case TokenType::kPow:
            out = *a ^ *b;
            break;
        case TokenType::kEq:
            out = unique_ptr<PrimitiveType>(new Boolean{*a == *b});
            break;
        case TokenType::kNotEq:
            out = unique_ptr<PrimitiveType>(new Boolean{*a != *b});
            break;
        default:
            auto boolA = dynamic_cast<Boolean *>(a);
            auto boolB = dynamic_cast<Boolean *>(b);
            if (boolA && boolB) {
                switch (op.type) {
                    case TokenType::kAndBool: {
                        out = *boolA && *boolB;
                        break;
                    }
                    case TokenType::kOrBool: {
                        out = *boolA || *boolB;
                        break;
                    }
                    default: {
                        throw EvaluationError("unsupported operation " + get<string>(op.value));
                    }
                }
            } else {
                throw EvaluationError("unsupported operation " + get<string>(op.value));
            }
    }
    return Result{Result::Type::kSingle, out};
}

/**
 * constructs binary operator node
 * @param left
 * @param t
 * @param right
 */
BinaryOperatorNode::BinaryOperatorNode(ASTPtr left, Token t, ASTPtr right) : left(std::move(left)),
                                                                             op(std::move(t)),
                                                                             right(std::move(right)) {}
/**
 * computes ternary operation
 * @param table
 * @return
 */
Result TernaryOperatorNode::eval(SymTable &table) {
    Result which = boolNode->eval(table);
    if (which.type == Result::Type::kSingle) {
        // convert result to boolean
        auto b = dynamic_cast<Boolean *>(get<ObjPtr>(which.data).get());
        if (!b) {
            throw EvaluationError("ternary operator requires boolean expression");
        }

        if (b->boolValue) {
            return trueExpr->eval(table);
        } else {
            return falseExpr->eval(table);
        }
    } else {
        throw EvaluationError("ternary operator expects expression");
    }
}

/**
 * constructs a ternary operator node
 * @param a
 * @param b
 * @param c
 */
TernaryOperatorNode::TernaryOperatorNode(ASTPtr a, ASTPtr b, ASTPtr c) : boolNode(std::move(a)),
                                                                         trueExpr(std::move(b)),
                                                                         falseExpr(std::move(c)) {
}

/**
 * returns data value
 * @param table
 * @return
 */
Result DataNode::eval(SymTable &table) {
    return Result{Result::Type::kSingle, value};
}

/**
 * constructs new data node
 * @param val
 */
DataNode::DataNode(ObjPtr val) : value(std::move(val)) {}

/**
 * computes unary operation
 * @param table
 * @return
 */
Result UnaryOperatorNode::eval(SymTable &table) {
    ObjPtr result;
    if (op.type == TokenType::kPlus) {
        return nextNode->eval(table);
    } else if (op.type == TokenType::kMinus) {
        Result n = nextNode->eval(table);
        if (n.type == Result::Type::kSingle) {
            result = get<ObjPtr>(nextNode->eval(table).data);
            auto &prim = dynamic_cast<PrimitiveType &>(*result);
            auto negation = new Number{-1};
            auto out = prim * *negation;
            delete negation;
            return Result{Result::Type::kSingle, out};
        } else {
            throw EvaluationError("unary operator requires evaluated expression");
        }

    } else if (op.type == TokenType::kNotUnary) {
        Result n = nextNode->eval(table);
        if (n.type == Result::Type::kSingle) {
            result = get<ObjPtr>(nextNode->eval(table).data);
            auto &logical = dynamic_cast<Boolean &>(*result);
            return Result{Result::Type::kSingle, !logical};
        } else {
            throw EvaluationError("unary operator requires evaluated expression");
        }
    }

    throw EvaluationError("unexpected unary operator " +
                          get<string>(op.value));
}

/**
 * constructs new unary operator node
 * @param op
 * @param next
 */
UnaryOperatorNode::UnaryOperatorNode(Token op, ASTPtr next) : nextNode(std::move(next)), op(std::move(op)) {}

/**
 * evaluates a matrix by evaluating each of its components
 * @param table
 * @return
 */
Result MatrixNode::eval(SymTable &table) {
    std::vector<std::vector<double>> arr;
    int dimR = arr.size(), dimC = dimR;
    for (auto const &row : matrix) {
        std::vector<double> r;
        dimC = row.size();
        for (auto const &col : row) {
            Result n = col->eval(table);
            if (n.type == Result::Type::kSingle) {
                ObjPtr obj = get<ObjPtr>(n.data);
                auto num = dynamic_cast<Number *>(obj.get());
                if (num) {
                    r.push_back(num->value);
                } else {
                    throw EvaluationError("matrix expects numeric elements");
                }
            } else {
                throw EvaluationError("matrix expects numeric elements");
            }
        }
        arr.push_back(r);
    }
    return Result{Result::Type::kSingle, make_shared<Matrix>(arr, dimR, dimC)};
}

/**
 * constructs new matrix node
 * @param m
 */
MatrixNode::MatrixNode(std::vector<std::vector<std::shared_ptr<ComputableNode>>> m) : matrix(std::move(m)) {
}
