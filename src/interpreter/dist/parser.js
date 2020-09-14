"use strict";
exports.__esModule = true;
exports.Parser = void 0;
var ast_1 = require("./ast");
var computable_1 = require("./computable");
var errors_1 = require("./errors");
var token_1 = require("./token");
var Parser = /** @class */ (function () {
    function Parser(lexer) {
        this.lexer = lexer;
        this.current_token = this.lexer.next_token();
    }
    /**
     * identify expression
     * expr   : term ((PLUS | MINUS) term)* | term ((PLUS | MINUS)term)*
     * term   : factor ((MUL | DIV | POW) factor)*
     * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix | variable | procedure
     * matrix :  lbracket (row)* rbracket
     */
    Parser.prototype.expr = function (ignoreWhiteSpace) {
        if (ignoreWhiteSpace === void 0) { ignoreWhiteSpace = true; }
        // first node
        var node = this.term();
        // do this until a new ((PLUS | MINUS) term) cannot be found
        while (this.current_token.type == token_1.TokenType.plus ||
            this.current_token.type == token_1.TokenType.minus) {
            // check white spaces,
            // if next character is empty or previous character is empty, binary operate
            if (ignoreWhiteSpace ||
                this.lexer.peek(1) == " " ||
                this.lexer.peek(-1) != " ") {
                // capture operator (PLUS | MINUS)
                var token = this.current_token;
                if (token.type == token_1.TokenType.plus) {
                    this.eat(token_1.TokenType.plus);
                }
                else if (token.type == token_1.TokenType.minus) {
                    this.eat(token_1.TokenType.minus);
                }
                // build abstract syntax tree
                node = new ast_1.BinaryOperatorNode(node, token, this.term());
            }
            else {
                return node;
            }
        }
        return node;
    };
    /**
     * identify term
     * term   : factor ((MUL | DIV) factor)*
     * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix
     * matrix :  lbracket (row)* rbracket
     * @return node
     */
    Parser.prototype.term = function () {
        // left factor
        var node = this.powers();
        // do this until a new ((POW | MUL | DIV | RDIV) factor) cannot be found
        while (this.current_token.type == token_1.TokenType.mul ||
            this.current_token.type == token_1.TokenType.div ||
            this.current_token.type == token_1.TokenType.rdiv) {
            // capture next operator (MUL | DIV)
            var token = this.current_token;
            if (token.type == token_1.TokenType.mul) {
                this.eat(token_1.TokenType.mul);
            }
            else if (token.type == token_1.TokenType.div) {
                this.eat(token_1.TokenType.div);
            }
            else if (token.type == token_1.TokenType.rdiv) {
                this.eat(token_1.TokenType.rdiv);
            }
            // build abstract syntax tree
            node = new ast_1.BinaryOperatorNode(node, token, this.powers());
        }
        return node;
    };
    Parser.prototype.powers = function () {
        // left factor
        var node = this.factor();
        while (this.current_token.type == token_1.TokenType.pow) {
            var token = this.current_token;
            if (token.type == token_1.TokenType.pow) {
                this.eat(token_1.TokenType.pow);
            }
            node = new ast_1.BinaryOperatorNode(node, token, this.factor());
        }
        return node;
    };
    /**
     * identify factor
     * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix
     * matrix :  lbracket (row)* rbracket
     * @return abstract syntax node
     */
    Parser.prototype.factor = function () {
        var token = this.current_token;
        if (token.type == token_1.TokenType.plus) {
            // positive sign
            this.eat(token_1.TokenType.plus);
            return new ast_1.UnaryOperatorNode(token, this.factor());
        }
        else if (token.type == token_1.TokenType.minus) {
            // negation sign
            this.eat(token_1.TokenType.minus);
            return new ast_1.UnaryOperatorNode(token, this.factor());
        }
        else if (token_1.isNumericToken(token)) {
            // token is a number
            this.eat(token_1.TokenType.num);
            return new ast_1.SingleValueNode(token.value);
        }
        else if (token.type == token_1.TokenType.lparen) {
            // lparen expr rparen
            this.eat(token_1.TokenType.lparen);
            var node = this.expr();
            this.eat(token_1.TokenType.rparen);
            return node;
        }
        else if (token.type == token_1.TokenType.lbracket) {
            // matrix
            var matrix = this.matrix();
            return new ast_1.SingleValueNode(matrix);
        }
        else if (token.type == token_1.TokenType.larrow) {
            var vector = this.vector();
            return new ast_1.SingleValueNode(vector);
        }
        else if (token.type == token_1.TokenType.id) {
            var next = this.lexer.peek();
            if (next && next == "(") {
                return this.procedure();
            }
            else {
                return this.variable();
            }
        }
        throw new errors_1.SyntaxError("unexpected symbol");
    };
    Parser.prototype.vector = function () {
        // check left arrow
        this.eat(token_1.TokenType.larrow);
        // get one row
        var row = this.matrix_row(token_1.TokenType.rarrow);
        // check right arrow
        this.eat(token_1.TokenType.rarrow);
        return new computable_1.Matrix([row]);
    };
    /**
     * matrix :  lbracket (row ;)* (row ]) rbracket
     */
    Parser.prototype.matrix = function () {
        var arr = new Array();
        // check left bracket
        this.eat(token_1.TokenType.lbracket, "parsing matrix: ");
        // loop through rows
        while (this.current_token.type != token_1.TokenType.rbracket) {
            var row = this.matrix_row(token_1.TokenType.rbracket);
            arr.push(row);
            if (this.current_token.type == token_1.TokenType.semicolon) {
                this.eat(token_1.TokenType.semicolon, "parsing matrix row: ");
            }
        }
        // check right bracket
        this.eat(token_1.TokenType.rbracket, "parsing matrix: ");
        return new computable_1.Matrix(arr);
    };
    /**
     * row : (factor,)*
     */
    Parser.prototype.matrix_row = function (endToken) {
        var arr = new Array();
        while (true) {
            var val = this.expr(false);
            // make sure the element is computable
            if (ast_1.isComputableNode(val)) {
                // everything else is good, push element into row
                arr.push(val);
                // if row hasn't reached end, consume 'comma' separator
                if (this.current_token.type != token_1.TokenType.semicolon &&
                    this.current_token.type != endToken) {
                    if (this.current_token.type == token_1.TokenType.comma) {
                        this.eat(token_1.TokenType.comma, "parsing matrix row: ");
                    }
                }
                else {
                    break;
                }
            }
            else {
                throw new errors_1.MatrixError("matrix parsing error: expected a numeric element");
            }
        }
        return arr;
    };
    /**
     * consume token and advance to next token
     * @param type token type to verify
     */
    Parser.prototype.eat = function (type, message) {
        if (this.current_token.type == type) {
            // if expected token type and current token type matches, proceed to next token
            this.current_token = this.lexer.next_token();
        }
        else {
            // if token type does not match, a syntax error has happened
            throw new errors_1.SyntaxError(message ||
                "" +
                    "expected " +
                    type.toString() +
                    ", but got " +
                    this.current_token.type.toString());
        }
    };
    /**
     * variable : id
     */
    Parser.prototype.variable = function () {
        if (token_1.isSymbolToken(this.current_token)) {
            var node = new ast_1.VariableNode(this.current_token);
            this.eat(token_1.TokenType.id);
            return node;
        }
        throw new errors_1.SymbolError("couldn't parse variable name");
    };
    /**
     * assignment : (variable = expr) (,variable = expr)*
     */
    Parser.prototype.assignment = function () {
        var left = this.variable();
        var token = this.current_token;
        this.eat(token_1.TokenType.assign, "parsing assignment: ");
        var right = this.expr();
        var assignments = [new ast_1.AssignNode(left, token, right)];
        //  check if multiline assignment
        if (this.current_token.type == token_1.TokenType.comma) {
            this.eat(token_1.TokenType.comma);
            var next = this.assignment();
            assignments = assignments.concat(next);
        }
        return assignments;
    };
    /**
     * procedure : id lparen (expr,)* rparen
     */
    Parser.prototype.procedure = function () {
        var token = this.current_token;
        if (!token_1.isSymbolToken(token)) {
            throw new errors_1.SymbolError("expected an identifier symbol but didn't get it!");
        }
        this.eat(token_1.TokenType.id);
        this.eat(token_1.TokenType.lparen);
        var args = [];
        while (true) {
            args.push(this.expr());
            if (this.current_token.type == token_1.TokenType.comma) {
                this.eat(token_1.TokenType.comma);
            }
            else {
                break;
            }
        }
        this.eat(token_1.TokenType.rparen);
        return new ast_1.ProcedureNode(token, args);
    };
    /**
     * assignment | procedure | expr
     */
    Parser.prototype.variable_statement = function () {
        var token = this.current_token;
        if (token.type == token_1.TokenType.id) {
            if (this.lexer.peekToken() == "=") {
                return this.assignment();
            }
            else if (this.lexer.peekToken() == "(") {
                return [this.procedure()];
            }
            else {
                return [this.expr()];
            }
        }
        throw new errors_1.ParsingError("couldn't find a variable!");
    };
    /**
     * statement : compound_statement | assignment_statment | expression_statement | empty
     */
    Parser.prototype.statement = function () {
        if (this.current_token.type == token_1.TokenType.id) {
            return this.variable_statement();
        }
        else {
            return [this.expr(true)];
        }
    };
    /**
     * statement_list : statement | statement endl statement_list
     */
    Parser.prototype.statement_list = function () {
        var results = this.statement();
        while (this.current_token.type == token_1.TokenType.endl) {
            this.eat(token_1.TokenType.endl);
            results = results.concat(this.statement());
        }
        if (this.current_token.type == token_1.TokenType.id) {
            throw new errors_1.SyntaxError("unexpected identifier");
        }
        return results;
    };
    /**
     * compound: statement_list
     */
    Parser.prototype.compound = function () {
        var nodes = this.statement_list();
        var node = new ast_1.CompoundNode();
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var n = nodes_1[_i];
            node._children.push(n);
        }
        return node;
    };
    Parser.prototype.program = function () {
        var node = this.compound();
        this.eat(token_1.TokenType.eof);
        return node;
    };
    /**
     * parse tokens into an abstract syntax tree for traversal
     */
    Parser.prototype.parse = function () {
        var node = this.program();
        if (this.current_token.type != token_1.TokenType.eof) {
            throw new errors_1.SyntaxError("parsing didn't go as expected!");
        }
        return node;
    };
    return Parser;
}());
exports.Parser = Parser;
