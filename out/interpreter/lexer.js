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
        this.reserved_keywords = {};
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
            /**
            // allow spaces in identifier names
            if (this.current_char && isspace(this.current_char)) {
              // ignore whitespace until next token
              this.ignore_whitespace(false);
              // check if next token is also alphanumeric
              let next = this.peek();
              if (next && isalnum(next)) {
                // if true, set next token
                this.advance()
              }
            }*/
        }
        return (this.reserved_keywords[result] || { type: token_1.TokenType.id, value: result });
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
     * retrieves next token without advancing position
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
        if (!this.current_char) {
            // no more characters
            return { type: token_1.TokenType.eof, value: "eof" };
        }
        if (util_1.isspace(this.current_char)) {
            // ignore all spaces
            this.ignore_whitespace();
        }
        if (util_1.isdigit(this.current_char)) {
            // capture numeric token
            return { type: token_1.TokenType.num, value: this.tokenize_number() };
        }
        else if (util_1.isalnum(this.current_char)) {
            return this._id();
        }
        else if (this.current_char == "+") {
            // capture "plus" token
            return token_1.plus_token;
        }
        else if (this.current_char == "-") {
            // capture "minus" token
            return token_1.minus_token;
        }
        else if (this.current_char == "*") {
            // capture "mul" token
            return token_1.mul_token;
        }
        else if (this.current_char == "/") {
            var next = this.peek();
            if (next && next == "/") {
                this.advance();
                return token_1.rdiv_token;
            }
            // capture "div" token
            return token_1.div_token;
        }
        else if (this.current_char == "(") {
            // capture "lparen" token
            return token_1.lparen_token;
        }
        else if (this.current_char == ")") {
            // capture "rparen" token
            return token_1.rparen_token;
        }
        else if (this.current_char == "[") {
            // capture "lbracket" token
            return token_1.lbracket_token;
        }
        else if (this.current_char == "]") {
            // capture "rbracket" token
            return token_1.rbracket_token;
        }
        else if (this.current_char == "<") {
            // capture "lbracket" token
            return token_1.larrow_token;
        }
        else if (this.current_char == ">") {
            // capture "rbracket" token
            return token_1.rarrow_token;
        }
        else if (this.current_char == ";") {
            // capture "semicolon" token
            return token_1.semicolon_token;
        }
        else if (this.current_char == ",") {
            // capture "comma" token
            return token_1.comma_token;
        }
        else if (this.current_char == "|") {
            // capture "bar" token
            return token_1.bar_token;
        }
        else if (this.current_char == "=" && this.peek() != "=") {
            // capture "assign" token
            return token_1.assign_token;
        }
        else if (this.current_char == "." && this.peek() != ".") {
            // capture "dot" token
            return token_1.dot_token;
        }
        else if (this.current_char == "\n") {
            // capture "endl" token
            return token_1.endl_token;
        }
        else if (this.current_char == "^") {
            // capture "^"
            return token_1.pow_token;
        }
        // token wasn't recognized
        throw new errors_1.SymbolError("unexpected token: `" + this.current_char + "`");
    };
    return Lexer;
}());
exports.Lexer = Lexer;
//# sourceMappingURL=lexer.js.map