//
// Created by Pranav Putta on 9/20/20.
//

#ifndef MATHSCRIPT_AST_H
#define MATHSCRIPT_AST_H

#include <utility>
#include <vector>
#include <string>
#include <variant>
#include "any"
#include "token.h"
#include "data.h"
#include "symtable.h"

struct Result {
    enum class Type {
        kCompound, kSingle, kNone
    };
    Type type;
    std::variant<ObjPtr, std::vector<ObjPtr>, std::monostate> data;

    inline Result(Type t, std::variant<ObjPtr, std::vector<ObjPtr>, std::monostate> data) : type(t),
                                                                                            data(std::move(data)) {}
};

typedef std::unique_ptr<Result> ResultPtr;


typedef struct AbstractSyntaxTreeNode {
public:
    /**
     * evaluates this tree node
     * @return returns value of computation if there is one,
     * void otherwise
     */
    virtual Result eval(SymTable &table) = 0;

} ASTNode;

typedef std::shared_ptr<ASTNode> ASTPtr;

struct EmptyNode : ASTNode {
    Result eval(SymTable &table) override;
};

struct CompoundNode : ASTNode {
    std::vector<ASTPtr> children;

    explicit inline CompoundNode(std::vector<ASTPtr> c) : children(std::move(c)) {}

    /**
     * loops through children and evaluates
     * @return
     */
    Result eval(SymTable &table) override;
};

struct ComputableNode : ASTNode {
    Result eval(SymTable &table) override = 0;
};

struct VariableNode : ComputableNode {
    std::string name;
    Unit unit;

    explicit VariableNode(std::string name);

    VariableNode(std::string name, Unit unit);

    /**
     * finds variable value and returns
     * @return runtime value of variable
     */
    Result eval(SymTable &table) override;
};

struct AssignmentNode : ComputableNode {
    std::shared_ptr<VariableNode> left;
    ASTPtr right;

    AssignmentNode(std::shared_ptr<VariableNode> l, ASTPtr right);

    Result eval(SymTable &table) override;
};

struct FunctionCallNode : ComputableNode {
    std::string name;
    std::vector<ASTPtr> arguments;

    FunctionCallNode(std::string name, std::vector<ASTPtr> args);

    Result eval(SymTable &table) override;
};

struct FunctionDefinitionNode : ASTNode {
    std::string name;
    std::vector<std::shared_ptr<VariableNode>> params;
    std::shared_ptr<CompoundNode> statements;

    Result eval(SymTable &table) override;

    FunctionDefinitionNode(std::string name, std::vector<std::shared_ptr<VariableNode>> params,
                           std::shared_ptr<CompoundNode> statements);
};

struct BinaryOperatorNode : ComputableNode {
    ASTPtr left;
    ASTPtr right;
    Token op;

    BinaryOperatorNode(ASTPtr left, Token op, ASTPtr right);

    Result eval(SymTable &table) override;
};

struct TernaryOperatorNode : ComputableNode {
    ASTPtr boolNode;
    ASTPtr trueExpr;
    ASTPtr falseExpr;

    TernaryOperatorNode(ASTPtr a, ASTPtr b, ASTPtr c);

    Result eval(SymTable &table) override;
};

struct DataNode : ComputableNode {
    ObjPtr value;

    explicit DataNode(ObjPtr val);

    Result eval(SymTable &table) override;
};

struct UnaryOperatorNode : ComputableNode {
    Token op;
    ASTPtr nextNode;

    UnaryOperatorNode(Token op, ASTPtr next);

    Result eval(SymTable &table) override;
};


struct MatrixNode : ComputableNode {
    std::vector<std::vector<std::shared_ptr<ComputableNode>>> matrix;

    explicit MatrixNode(std::vector<std::vector<std::shared_ptr<ComputableNode>>> m);

    Result eval(SymTable &table) override;
};

#endif //MATHSCRIPT_AST_H
