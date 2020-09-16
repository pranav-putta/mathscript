"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
var ast_1 = require("./ast");
var computable_1 = require("./computable");
var errors_1 = require("./errors");
var lexer_1 = require("./lexer");
var token_1 = require("./token");
var Parser = /** @class */ (function () {
    function Parser(lexer) {
        this.lexer = lexer;
        this.current_token = this.lexer.next_token();
    }
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
    /**
     * identify expression
     * expr   : term ((PLUS | MINUS) term)* | term ((PLUS | MINUS)term)*
     * term   : powers ((MUL | DIV ) powers)*
     * powers : factor ((POW) factor)*
     * factor : (PLUS | MINUS) factor | NUMBER | lparen expr rparen | matrix | variable | procedure | (TRUE | FALSE)
     * matrix :  lbracket (row)* rbracket
     */
    Parser.prototype.expr = function (ignoreWhiteSpace) {
        if (ignoreWhiteSpace === void 0) { ignoreWhiteSpace = true; }
        var powers = this.binop(this.factor, [token_1.TokenType.pow]);
        var mul_div = this.binop(powers, [token_1.TokenType.mul, token_1.TokenType.div]);
        var add_plus = this.binop(mul_div, [token_1.TokenType.plus, token_1.TokenType.minus], ignoreWhiteSpace);
        var and = this.binop(add_plus, [token_1.TokenType.and_bool]);
        var or = this.binop(and, [token_1.TokenType.or_bool]);
        return or();
    };
    Parser.prototype.bool = function () {
        var token = this.current_token;
        if (token.type == token_1.TokenType.id) {
            if (token.value === lexer_1.Lexer.reserved_keywords["true"].value) {
                return new ast_1.SingleValueNode(new computable_1.Logical(true));
            }
            else if (token.value === lexer_1.Lexer.reserved_keywords["false"].value) {
                return new ast_1.SingleValueNode(new computable_1.Logical(true));
            }
        }
        throw new errors_1.ParsingError("unexpected symbol: " + token.value);
    };
    /**
     * create a binary operation function
     * @param func function to process
     * @param operators operators to check for
     * @param ignoreWhiteSpace check for whitespace pattern " + 1" => plus, " +1" => unary positive
     */
    Parser.prototype.binop = function (func, operators, ignoreWhiteSpace) {
        var _this = this;
        if (ignoreWhiteSpace === void 0) { ignoreWhiteSpace = true; }
        // create a callable function
        var call = function () {
            // left node
            var node = func();
            var token = _this.current_token;
            while (operators.includes(token.type)) {
                if (ignoreWhiteSpace ||
                    _this.lexer.peek(1) == " " ||
                    _this.lexer.peek(-1) != " ") {
                    _this.eat(token.type);
                    node = new ast_1.BinaryOperatorNode(node, token, func());
                }
                else {
                    return node;
                }
            }
            return node;
        };
        return call;
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
            return new ast_1.SingleValueNode(new computable_1.Numeric(token.value));
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
            // vector (meaning single row matrix)
            var vector = this.vector();
            return new ast_1.SingleValueNode(vector);
        }
        else if (token.type == token_1.TokenType.id) {
            // identifier
            var next = this.lexer.peek();
            if (next && next == "(") {
                // procedure
                return this.procedure();
            }
            else {
                // variable identifier
                return this.variable();
            }
        }
        else {
            return this.bool();
        }
        throw new errors_1.SyntaxError("unexpected symbol");
    };
    /**
     * vector : single row matrix
     */
    Parser.prototype.vector = function () {
        // check left arrow
        this.eat(token_1.TokenType.larrow);
        // get one row
        var row = this.matrix_row(token_1.TokenType.rarrow);
        // check right arrow
        this.eat(token_1.TokenType.rarrow);
        return new computable_1.UnevaluatedMatrix([row]);
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
        return new computable_1.UnevaluatedMatrix(arr);
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
     * program : compound eof
     */
    Parser.prototype.program = function () {
        var node = this.compound();
        this.eat(token_1.TokenType.eof);
        return node;
    };
    /**
     * compound: statement_list
     */
    Parser.prototype.compound = function () {
        return new ast_1.CompoundNode(this.statement_list());
    };
    /**
     * statement_list : statement | statement endl statement_list
     */
    Parser.prototype.statement_list = function () {
        var results = this.statement();
        while (this.current_token.type == token_1.TokenType.endl) {
            // ignore all end lines
            while (this.current_token.type == token_1.TokenType.endl) {
                this.eat(token_1.TokenType.endl);
            }
            results = results.concat(this.statement());
        }
        if (this.current_token.type == token_1.TokenType.id) {
            throw new errors_1.SyntaxError("unexpected identifier");
        }
        return results;
    };
    /**
     * statement : id_statement | expr
     */
    Parser.prototype.statement = function () {
        if (this.current_token.type == token_1.TokenType.id) {
            return this.id_statement();
        }
        else if (this.current_token.type != token_1.TokenType.eof) {
            return [this.expr(true)];
        }
        else {
            return [];
        }
    };
    /**
     * id_statement : assignemnt | procedure | expr
     */
    Parser.prototype.id_statement = function () {
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
        throw new errors_1.ParsingError("couldn't find an identifier!");
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
    return Parser;
}());
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map