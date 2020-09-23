//
// Created by Pranav Putta on 9/20/20.
//

#ifndef MATHSCRIPT_SYMTABLE_H
#define MATHSCRIPT_SYMTABLE_H

#include <map>
#include <vector>
#include <functional>
#include <stack>
#include "string"
#include "data.h"

class CompoundNode;

class VariableNode;

class Result;

enum class Scope {
    kGlobal, kBlock
};

typedef Result (*Function)(std::vector<ObjPtr>);

typedef struct {
    std::shared_ptr<CompoundNode> statements;
    std::vector<std::shared_ptr<VariableNode>> params;
} FunctionDef;

class SymTable {
private:
    SymTable *parent;

    std::map<std::string, std::variant<Function, FunctionDef>> functions;
    std::map<std::string, ObjPtr> variables;

    ObjPtr RecFindVariable(const SymTable &node, const std::string &name) const;

    Result RecExecuteFunction(const SymTable &node, const std::string &name, const std::vector<ObjPtr> &args);

public:
    [[nodiscard]] ObjPtr FindVariable(const std::string &name) const;

    void AssignVariable(const std::string &name, ObjPtr obj);

    Result ExecuteFunction(const std::string &name, const std::vector<ObjPtr> &args);

    void CreateFunction(const std::string &name, std::vector<std::shared_ptr<VariableNode>> v, std::shared_ptr<CompoundNode> args);

    static SymTable &ConstructGlobalTable();

};

#endif //MATHSCRIPT_SYMTABLE_H
