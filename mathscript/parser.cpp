//
// Created by Pranav Putta on 9/20/20.
//

#include "parser.h"
#include "errors.h"

#include <utility>

using namespace std;

/**
 * constructs a parser object
 * @param lex Lexer object
 */
Parser::Parser(Lexer lex) : lexer(std::move(lex)) {
    current_token = lexer.NextToken();
    kNumOfOpLevels = 8;
    order_of_operations = {
            {TokenType::kPow,     0},
            {TokenType::kMod,     1},
            {TokenType::kMul,     2},
            {TokenType::kDiv,     2},
            {TokenType::kPlus,    3},
            {TokenType::kMinus,   3},
            {TokenType::kAndBit,  4},
            {TokenType::kOrBit,   4},
            {TokenType::kLessEq,  5},
            {TokenType::kMoreEq,  5},
            {TokenType::kRArrow,  5},
            {TokenType::kLArrow,  5},
            {TokenType::kEq,      5},
            {TokenType::kNotEq,   5},
            {TokenType::kAndBool, 6},
            {TokenType::kOrBool,  7}
    };
}

/**
 * parses the input into an abstract syntax tree
 * @return AST representation of input
 */
ASTPtr Parser::Parse() {
    ASTPtr node = Program();
    if (current_token.type != TokenType::kEof) {
        throw EvaluationError("expected eof!");
    }
    return node;
}

/**
 * consume current token and match with type
 * @param t desired match type
 */
void Parser::Eat(TokenType t) {
    if (current_token.type == t) {
        current_token = lexer.NextToken();
    } else {
        string current;
        if (current_token.type == TokenType::kNum) {
            current = to_string(get<double>(current_token.value));
        } else {
            current = get<string>(current_token.value);
        }
        throw EvaluationError("expected " + Global::TokenMap()[t] + ", but got " + current);
    }
}

/**
 * identify a factor
 * factor: (+ | -) num | num | (!) bool |
 * lparen (expr*) rparen | lbracket matrix rbracket |
 * variable | function
 * @param ignoreWhiteSpace
 * @return
 */
ASTPtr Parser::Factor(bool ignoreWhiteSpace) {
    Token tok = current_token;
    switch (tok.type) {
        case TokenType::kPlus: {
            Eat(TokenType::kPlus);
            return make_shared<UnaryOperatorNode>(tok, Factor(ignoreWhiteSpace));
        }
        case TokenType::kMinus: {
            Eat(TokenType::kMinus);
            return make_shared<UnaryOperatorNode>(tok, Factor(ignoreWhiteSpace));
        }
        case TokenType::kNotUnary: {
            Eat(TokenType::kNotUnary);
            return make_shared<UnaryOperatorNode>(tok, Factor(ignoreWhiteSpace));
        }
        case TokenType::kNum: {
            Eat(TokenType::kNum);
            auto data = make_shared<Number>(get<double>(tok.value));

            // check for unit identifier
            if (current_token.type == TokenType::kId &&
                Global::UnitMap().contains(std::get<string>(current_token.value))) {
                data->unit = Global::UnitMap().at(std::get<string>(current_token.value));
                Eat(TokenType::kId);
            }
            return make_shared<DataNode>(data);
        }
        case TokenType::kLParen: {
            Eat(TokenType::kLParen);
            ASTPtr node = Expr(ignoreWhiteSpace);
            Eat(TokenType::kRParen);
            return node;
        }
        case TokenType::kLBracket: {
            return make_shared<MatrixNode>(Matrix());
        }
        case TokenType::kReservedValue: {
            return ReservedValue();
        }
        case TokenType::kId: {
            Token next = lexer.PeekToken();
            if (next.type == TokenType::kLParen) {
                // look for procedure
                shared_ptr<FunctionCallNode> node = Function();
                // check if defining a procedure or calling it
                if (current_token.type == TokenType::kAssign || current_token.type == TokenType::kDef) {
                    return FunctionDefinition(node);
                }
                return node;
            } else {
                return Variable();
            }
        }
        default:
            return make_unique<EmptyNode>();
    }
}

/**
 * recursively calls all binary operators
 * @param level operation level
 * @param ignoreWhiteSpace should perform matrix whitespace or ignore
 * @return Tree Node
 */
ASTPtr Parser::RecBinOp(int level, bool ignoreWhiteSpace) {
    // base, once all operations are tried
    if (level < 0) {
        return Factor(ignoreWhiteSpace);
    }

    ASTPtr node = RecBinOp(level - 1, ignoreWhiteSpace);
    ignoreWhiteSpace = ignoreWhiteSpace || order_of_operations[TokenType::kPlus] == level;

    while (order_of_operations.contains(current_token.type) && order_of_operations[current_token.type] == level) {
        if (ignoreWhiteSpace || lexer.Peek(0) == ' ' || lexer.Peek(-2) != ' ') {
            Token op = current_token;
            Eat(current_token.type);
            node = make_shared<BinaryOperatorNode>(node, op, RecBinOp(level - 1, ignoreWhiteSpace));
        } else {
            return node;
        }
    }
    return node;
}

/**
 * creates an expression
 * factor op factor | expr ? expr : expr
 * @param ignoreWhiteSpace should perform matrix whitespace or ignore
 * @return Tree Node
 */
ASTPtr Parser::Expr(bool ignoreWhiteSpace) {
    ASTPtr expression = RecBinOp(kNumOfOpLevels, ignoreWhiteSpace);

    if (current_token.type == TokenType::kTernary) {
        Eat(TokenType::kTernary);
        ASTPtr t = Expr(ignoreWhiteSpace);
        Eat(TokenType::kColon);
        ASTPtr f = Expr(ignoreWhiteSpace);
        return make_shared<TernaryOperatorNode>(expression, t, f);
    }
    return expression;
}

/**
 * creates a function
 * function: id(variable (,variable)*) = expr | { compound }
 * @param proc
 * @return tree node
 */
ASTPtr Parser::FunctionDefinition(const std::shared_ptr<FunctionCallNode> &proc) {
    Eat(current_token.type);

    // make sure all arguments are variables
    vector<std::shared_ptr<VariableNode>> args;
    for (const std::shared_ptr<ASTNode> &arg : proc->arguments) {
        auto res = dynamic_pointer_cast<VariableNode>(arg);
        if (!res) {
            throw EvaluationError("function arguments must be variables");
        }
        args.push_back(res);
    }

    // load expressions
    if (current_token.type == TokenType::kLBrace) {
        // multi line statements
        Eat(TokenType::kLBrace);
        auto exprs = Compound();
        Eat(TokenType::kRBrace);
        return make_shared<FunctionDefinitionNode>(proc->name, args, exprs);
    } else {
        // single line statement
        vector<ASTPtr> expr = {Expr(true)};
        return make_shared<FunctionDefinitionNode>(proc->name, args, make_shared<CompoundNode>(expr));
    }
}

/**
 * creates a variable assignment
 * assignment: var = expr
 * @return tree node
 */
ASTPtr Parser::Assignment() {
    std::shared_ptr<VariableNode> left = Variable();
    Eat(TokenType::kAssign);
    ASTPtr right = Expr(true);

    return make_shared<AssignmentNode>(left, right);
}

/**
 * list of assignments
 * assignments: assignment = expr (,assignment = expr)*
 * @return tree node
 */
vector<ASTPtr> Parser::Assignments() {
    vector<ASTPtr> assignments = {Assignment()};
    // check for multiline assignments
    if (current_token.type == TokenType::kComma) {
        Eat(TokenType::kComma);
        assignments.push_back(Assignment());
    }
    return assignments;
}

/**
 * creates a function call
 * func_call: id(variable (,variable)*)
 * @return tree node
 */
shared_ptr<FunctionCallNode> Parser::Function() {
    std::string name = get<string>(current_token.value);
    Eat(TokenType::kId);
    Eat(TokenType::kLParen);
    vector<ASTPtr> args;
    while (current_token.type != TokenType::kRParen) {
        args.push_back(Expr(true));
        
        if (current_token.type == TokenType::kComma) {
            Eat(TokenType::kComma);
        } else {
            break;
        }
    }
    Eat(TokenType::kRParen);
    return make_shared<FunctionCallNode>(name, args);
}

/**
 * parses different types of identifier results
 * @return tree node
 */
std::vector<ASTPtr> Parser::Identifier() {
    if (current_token.type == TokenType::kId) {
        if (lexer.PeekToken().type == TokenType::kAssign) {
            return Assignments();
        } else {
            return std::vector<ASTPtr>{Expr(true)};
        }
    }

    throw EvaluationError("couldn't find an identifier!");
}

// todo: implement reserved words
std::vector<ASTPtr> Parser::Reserved() {
    return std::vector<ASTPtr>();
}

/**
 * reserved values: true | false
 * @return DataNode
 */
ASTPtr Parser::ReservedValue() {
    std::string val = get<string>(current_token.value);
    if (val == "true") {
        Eat(TokenType::kReservedValue);
        return make_shared<DataNode>(make_shared<Boolean>(true));
    } else if (val == "false") {
        Eat(TokenType::kReservedValue);
        return make_shared<DataNode>(make_shared<Boolean>(false));
    } else {
        throw EvaluationError("unexpected symbol ");
    }
}

/**
 * statement: expr | assignment
 * @return
 */
std::vector<ASTPtr> Parser::Statement() {
    if (current_token.type == TokenType::kId) {
        return Identifier();
    } else if (current_token.type == TokenType::kReserved) {
        return Reserved();
    } else if (current_token.type != TokenType::kEof) {
        return std::vector<ASTPtr>{Expr(true)};
    } else {
        return std::vector<ASTPtr>();
    }
}

/**
 * statements: (statement\n)*
 * @return
 */
vector<ASTPtr> Parser::StatementList() {
    IgnoreNewLines();
    vector<ASTPtr> results = Statement();
    while (current_token.type == TokenType::kEndL) {
        IgnoreNewLines();
        vector<ASTPtr> nextStatement = Statement();
        results.insert(results.end(), nextStatement.begin(), nextStatement.end());
    }

    if (current_token.type == TokenType::kId) {
        throw EvaluationError("unexpected symbol");
    }

    return results;
}

/**
 * compound: statementlist
 * @return
 */
shared_ptr<CompoundNode> Parser::Compound() {
    return make_shared<CompoundNode>(StatementList());
}

/**
 * program: compound
 * @return
 */
ASTPtr Parser::Program() {
    ASTPtr node = Compound();
    Eat(TokenType::kEof);
    return node;
}

/**
 * ignores any new lines in sequence
 */
void Parser::IgnoreNewLines() {
    while (current_token.type == TokenType::kEndL) {
        Eat(TokenType::kEndL);
    }
}

/**
 * identifies a variable
 * variable: id
 * @return variable node
 */
shared_ptr<VariableNode> Parser::Variable() {
    std::string name = get<string>(current_token.value);
    auto node = make_shared<VariableNode>(name);
    Eat(TokenType::kId);


    return node;
}

/**
 * matrix: [ row (;row)* ]
 * @return matrix
 */
std::vector<std::vector<shared_ptr<ComputableNode>>> Parser::Matrix() {
    vector<vector<shared_ptr<ComputableNode>>> arr;
    Eat(TokenType::kLBracket);
    // loop through rows
    while (current_token.type != TokenType::kRBracket) {
        arr.push_back(MatrixRow(TokenType::kRBracket));
        if (current_token.type == TokenType::kSemicolon) {
            Eat(TokenType::kSemicolon);
        }
    }
    Eat(TokenType::kRBracket);
    return arr;
}

/**
 * row: num (;num)*
 * @param end
 * @return matrix row
 */
std::vector<shared_ptr<ComputableNode>> Parser::MatrixRow(TokenType end) {
    vector<shared_ptr<ComputableNode>> arr;

    while (true) {
        ASTPtr expr = Expr(false);
        shared_ptr<ComputableNode> dataNode = dynamic_pointer_cast<ComputableNode>(expr);
        // make sure all elements are computable
        if (dataNode) {
            arr.push_back(dataNode);
            // if row hasn't reached end, consume 'comma' separator
            if (current_token.type != TokenType::kSemicolon && current_token.type != end) {
                if (current_token.type == TokenType::kComma) {
                    Eat(TokenType::kComma);
                }
            } else {
                break;
            }
        } else {
            throw EvaluationError("Must pass a numeric element");
        }
    }

    return arr;
}
