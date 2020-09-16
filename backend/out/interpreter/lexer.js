"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
var errors_1 = require("./errors");
var token_1 = require("./token");
var util_1 = require("./util");
/**
 * Lexer tokenizes raw input into @class{Token} objects
 */
var Lexer = /** @class */ (function () {
    function Lexer(text) {
        this.text = text;
        this.position = -1;
    }
    Lexer.prototype._id = function () {
        var result = "";
        while (this.current_char && util_1.isalnum(this.current_char)) {
            result += this.current_char;
            var next = this.peek();
            if (next && util_1.isalnum(next)) {
                this.advance();
            }
            else {
                break;
            }
        }
        return (Lexer.reserved_keywords[result] || { type: token_1.TokenType.id, value: result });
    };
    /**
     * increments position and updates current_char
     * sets current_char to undefined if position is out of bounds
     */
    Lexer.prototype.advance = function () {
        this.position++;
        if (this.position < this.text.length) {
            this.current_char = this.text.charAt(this.position);
        }
        else {
            this.current_char = undefined;
        }
    };
    /**
     * retrieves next character without advancing position
     * @param steps number of steps to take
     */
    Lexer.prototype.peek = function (steps) {
        if (steps === void 0) { steps = 1; }
        if (this.position + steps >= this.text.length) {
            return undefined;
        }
        else {
            return this.text.charAt(this.position + steps);
        }
    };
    /**
     * retrieves the next token by ignoring whitespaces
     */
    Lexer.prototype.peekToken = function () {
        var pos = this.position + 1;
        while (pos < this.text.length && util_1.isspace(this.text.charAt(pos))) {
            pos += 1;
        }
        return this.text.charAt(pos);
    };
    /**
     * skips all whitepsace in sequence
     */
    Lexer.prototype.ignore_whitespace = function (advance) {
        if (advance === void 0) { advance = true; }
        if (advance) {
            // stop at next token
            while (this.current_char && util_1.isspace(this.current_char)) {
                this.advance();
            }
        }
        else {
            // stop before next token
            var current = this.peek();
            while (current && util_1.isspace(current)) {
                this.advance();
            }
        }
    };
    /**
     * converts numeric character sequence into a token
     */
    Lexer.prototype.tokenize_number = function () {
        var result = this.current_char || "";
        var next = this.peek();
        // capture integer
        while (next && util_1.isdigit(next)) {
            this.advance();
            result += this.current_char;
            next = this.peek();
        }
        // check if decimal point
        if (next && next == ".") {
            var tmpNext = this.peek(2);
            // make sure next character is a digit, not an elipses or something like '1.'
            if (tmpNext && util_1.isdigit(tmpNext)) {
                this.advance();
                result += this.current_char;
                next = this.peek();
                // append numbers after decimal point
                while (next && util_1.isdigit(next)) {
                    this.advance();
                    result += this.current_char;
                    next = this.peek();
                }
            }
        }
        // convert to number and return
        return Number(result);
    };
    /**
     * retrieves next token in string
     */
    Lexer.prototype.next_token = function () {
        this.advance();
        var token = this.tokenize();
        return token;
    };
    /**
     * compares characters and matches with associated token
     */
    Lexer.prototype.tokenize = function () {
        // ignore all spaces
        if (this.current_char && util_1.isspace(this.current_char)) {
            this.ignore_whitespace();
        }
        // check if no more characters
        if (!this.current_char) {
            return { type: token_1.TokenType.eof, value: "eof" };
        }
        if (util_1.isdigit(this.current_char)) {
            // capture numeric token
            return { type: token_1.TokenType.num, value: this.tokenize_number() };
        }
        else if (util_1.isalnum(this.current_char)) {
            return this._id();
        }
        else if (this.current_char == "+") {
            return token_1.newToken(token_1.TokenType.plus);
        }
        else if (this.current_char == "-") {
            return token_1.newToken(token_1.TokenType.minus);
        }
        else if (this.current_char == "*") {
            return token_1.newToken(token_1.TokenType.mul);
        }
        else if (this.current_char == "/") {
            // check if token is rdiv
            var next = this.peek();
            if (next && next == "/") {
                this.advance();
                return token_1.newToken(token_1.TokenType.rdiv);
            }
            return token_1.newToken(token_1.TokenType.div);
        }
        else if (this.current_char == "(") {
            return token_1.newToken(token_1.TokenType.lparen);
        }
        else if (this.current_char == ")") {
            return token_1.newToken(token_1.TokenType.rparen);
        }
        else if (this.current_char == "[") {
            return token_1.newToken(token_1.TokenType.lbracket);
        }
        else if (this.current_char == "]") {
            return token_1.newToken(token_1.TokenType.rbracket);
        }
        else if (this.current_char == "<") {
            return token_1.newToken(token_1.TokenType.larrow);
        }
        else if (this.current_char == ">") {
            return token_1.newToken(token_1.TokenType.rarrow);
        }
        else if (this.current_char == ";") {
            return token_1.newToken(token_1.TokenType.semicolon);
        }
        else if (this.current_char == ",") {
            return token_1.newToken(token_1.TokenType.comma);
        }
        else if (this.current_char == "|") {
            return token_1.newToken(token_1.TokenType.bar);
        }
        else if (this.current_char == "=" && this.peek() != "=") {
            return token_1.newToken(token_1.TokenType.assign);
        }
        else if (this.current_char == "." && this.peek() != ".") {
            return token_1.newToken(token_1.TokenType.dot);
        }
        else if (this.current_char == "\n") {
            return token_1.newToken(token_1.TokenType.endl);
        }
        else if (this.current_char == "^") {
            return token_1.newToken(token_1.TokenType.pow);
        }
        else if (this.current_char == "&") {
            // check if token is boolean and
            var next = this.peek();
            if (next && next == "&") {
                this.advance();
                return token_1.newToken(token_1.TokenType.and_bool);
            }
            return token_1.newToken(token_1.TokenType.and);
        }
        else if (this.current_char == "|") {
            // check if token is rdiv
            var next = this.peek();
            if (next && next == "|") {
                this.advance();
                return token_1.newToken(token_1.TokenType.or_bool);
            }
            return token_1.newToken(token_1.TokenType.or);
        }
        // token wasn't recognized
        throw new errors_1.SymbolError("unexpected token: `" + this.current_char + "`");
    };
    Lexer.reserved_keywords = {
        true: token_1.newToken(token_1.TokenType.id, "true"),
        false: token_1.newToken(token_1.TokenType.id, "false"),
    };
    return Lexer;
}());
exports.Lexer = Lexer;
//# sourceMappingURL=lexer.js.map