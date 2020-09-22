//
// Created by Pranav Putta on 9/20/20.
//

#ifndef MATHSCRIPT_PARSER_H
#define MATHSCRIPT_PARSER_H

#include <utility>


#include "lexer.h"
#include "symtable.h"
#include "ast.h"

class Parser {
private:
    Lexer lexer;
    Token current_token;
    int kNumOfOpLevels;
    std::map<TokenType, int> order_of_operations;

    void Eat(TokenType token);


    ASTPtr Program();

    std::shared_ptr<CompoundNode> Compound();

    void IgnoreNewLines();

    std::vector<ASTPtr> StatementList();

    std::vector<ASTPtr> Statement();

    ASTPtr FunctionDefinition(const std::shared_ptr<FunctionCallNode> &fc);

    std::vector<ASTPtr> Identifier();

    ASTPtr Assignment();

    std::vector<ASTPtr> Assignments();

    std::shared_ptr<FunctionCallNode> Function();

    std::shared_ptr<VariableNode> Variable();

    std::vector<ASTPtr> Reserved();

    ASTPtr ReservedValue();

    std::vector<std::vector<std::shared_ptr<ComputableNode>>> Matrix();

    std::vector<std::shared_ptr<ComputableNode>> MatrixRow(TokenType end);

    ASTPtr Factor(bool ignoreWhiteSpace);

    ASTPtr Expr(bool ignoreWhiteSpace = true);

    ASTPtr RecBinOp(int op, bool ignoreWhiteSpace);

public:
    explicit Parser(Lexer lex);

    ASTPtr Parse();


};


#endif //MATHSCRIPT_PARSER_H
