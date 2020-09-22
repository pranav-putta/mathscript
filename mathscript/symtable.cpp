//
// Created by Pranav Putta on 9/20/20.
//

#include "symtable.h"

#include <utility>
#include "errors.h"
#include "ast.h"

/**
 * Finds specified variable recursively
 * @param name name of variable
 * @return pointer to variable value
 */
ObjPtr SymTable::FindVariable(const std::string &name) const {
    // reached global symtable
    return RecFindVariable(this, name);
}

/**
 * Recursive implementation of variable find.
 * Checks variable map for specified name. If not found, progresses up stack
 * If reaches a null node, then no variables were found
 * @param node node to check
 * @param name variable name
 * @return pointer to variable value
 */
ObjPtr SymTable::RecFindVariable(const SymTable *node, const std::string &name) const {
    if (node == nullptr) {
        throw UndeclaredVariableError(name);
    }

    if (node->variables.contains(name)) {
        return node->variables.at(name);
    }
    return RecFindVariable(node->parent, name);
}

/**
 * Assigns a variable to the current symtable
 * @param name variable name
 * @param obj object to set
 */
void SymTable::AssignVariable(const std::string &name, ObjPtr obj) {
    variables[name] = std::move(obj);
}

/**
 * executes the specified function
 * @param name function name
 * @param args function arguments
 * @return
 */
Result SymTable::ExecuteFunction(const std::string &name, const std::vector<ObjPtr> &args) {
    return RecExecuteFunction(this, name, args);
}

/**
 * recursive implementation to execute function
 * @param node current node
 * @param name function name
 * @param args function arguments
 * @return result pointer
 */
Result
SymTable::RecExecuteFunction(SymTable *node, const std::string &name, const std::vector<ObjPtr> &args) {
    if (node->parent == nullptr) {
        // global symbol table so check built-in C++ functions
        if (node->functions.contains(name)) {
            auto func = node->functions.at(name);
            // if built in function, run, otherwise execute ast
            if (func.index() == 0) {
                return std::get<Function>(func)(args);
            }
        } else {
            throw EvaluationError("function '" + name + "' not defined!");
        }
    }

    if (node->functions.contains(name)) {
        auto func = std::get<FunctionDef>(node->functions.at(name));
        auto newNode = new SymTable;
        newNode->parent = this;

        // check argument size
        if (func.params.size() != args.size()) {
            throw EvaluationError("didn't get expected arguments");
        }
        // load variables into new symtable
        for (int i = 0; i < func.params.size(); i++) {
            newNode->variables[func.params[i]->name] = args[i];
        }
        auto const eval = std::get<std::vector<ObjPtr>>(func.statements->eval(*newNode).data);
        if (eval.empty()) {
            throw EvaluationError("function didn't return anything");
        }
        // return last output from function
        return Result{Result::Type::kSingle, eval[eval.size() - 1]};
    }
    return RecExecuteFunction(node->parent, name, args);
}

/**
 * creates a new function in symtable
 * @param name function name
 * @param params parameters
 * @param statements block
 */
void SymTable::CreateFunction(const std::string &name, std::vector<std::shared_ptr<VariableNode>> params,
                              std::shared_ptr<CompoundNode> statements) {
    functions[name] = FunctionDef{std::move(statements), std::move(params)};
}

/**
 * static create an initial symtable
 * @return symtable
 */
SymTable &SymTable::ConstructGlobalTable() {
    auto table = new SymTable;
    table->parent = nullptr;
    table->functions = {};
    return *table;
}

