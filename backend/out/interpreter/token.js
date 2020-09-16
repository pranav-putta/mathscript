"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newToken = exports.isNumericToken = exports.isSymbolToken = exports.TokenType = void 0;
/**
 * supported token characters
 */
var TokenType;
(function (TokenType) {
    TokenType["num"] = "num";
    TokenType["plus"] = "+";
    TokenType["minus"] = "-";
    TokenType["mul"] = "*";
    TokenType["pow"] = "^";
    TokenType["div"] = "/";
    TokenType["rdiv"] = "//";
    TokenType["lparen"] = "(";
    TokenType["rparen"] = ")";
    TokenType["lbracket"] = "[";
    TokenType["rbracket"] = "]";
    TokenType["larrow"] = "<";
    TokenType["rarrow"] = ">";
    TokenType["semicolon"] = ";";
    TokenType["comma"] = ",";
    TokenType["space"] = "~";
    TokenType["assign"] = "=";
    TokenType["bar"] = "|";
    TokenType["dot"] = ".";
    TokenType["endl"] = "\n";
    TokenType["id"] = "id";
    TokenType["eof"] = "eof";
    TokenType["and"] = "&";
    TokenType["or"] = "|";
    TokenType["and_bool"] = "&&";
    TokenType["or_bool"] = "||";
})(TokenType || (TokenType = {}));
exports.TokenType = TokenType;
function newToken(type, value) {
    return { type: type, value: value || type.toString() };
}
exports.newToken = newToken;
function isSymbolToken(token) {
    return typeof token.value === "string";
}
exports.isSymbolToken = isSymbolToken;
function isNumericToken(token) {
    return typeof token.value === "number" && token.type == TokenType.num;
}
exports.isNumericToken = isNumericToken;
//# sourceMappingURL=token.js.map