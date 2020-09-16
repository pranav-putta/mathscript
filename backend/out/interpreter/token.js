"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNumericToken = exports.isSymbolToken = exports.TokenType = exports.pow_token = exports.rarrow_token = exports.larrow_token = exports.rdiv_token = exports.id_token = exports.endl_token = exports.dot_token = exports.assign_token = exports.bar_token = exports.eof_token = exports.semicolon_token = exports.comma_token = exports.rbracket_token = exports.lbracket_token = exports.rparen_token = exports.lparen_token = exports.div_token = exports.mul_token = exports.minus_token = exports.plus_token = void 0;
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
})(TokenType || (TokenType = {}));
exports.TokenType = TokenType;
// generated tokens
exports.plus_token = {
    type: TokenType.plus,
    value: TokenType.plus.toString(),
};
exports.minus_token = {
    type: TokenType.minus,
    value: TokenType.minus.toString(),
};
exports.mul_token = {
    type: TokenType.mul,
    value: TokenType.mul.toString(),
};
exports.div_token = {
    type: TokenType.div,
    value: TokenType.div.toString(),
};
exports.lparen_token = {
    type: TokenType.lparen,
    value: TokenType.lparen.toString(),
};
exports.rparen_token = {
    type: TokenType.rparen,
    value: TokenType.rparen.toString(),
};
exports.lbracket_token = {
    type: TokenType.lbracket,
    value: TokenType.lbracket.toString(),
};
exports.rbracket_token = {
    type: TokenType.rbracket,
    value: TokenType.rbracket.toString(),
};
exports.comma_token = {
    type: TokenType.comma,
    value: TokenType.comma.toString(),
};
exports.semicolon_token = {
    type: TokenType.semicolon,
    value: TokenType.semicolon.toString(),
};
exports.eof_token = {
    type: TokenType.eof,
    value: TokenType.eof.toString(),
};
exports.bar_token = {
    type: TokenType.bar,
    value: TokenType.bar.toString(),
};
exports.assign_token = {
    type: TokenType.assign,
    value: TokenType.assign.toString(),
};
exports.dot_token = {
    type: TokenType.dot,
    value: TokenType.dot.toString(),
};
exports.endl_token = {
    type: TokenType.endl,
    value: TokenType.endl.toString(),
};
exports.id_token = {
    type: TokenType.id,
    value: TokenType.id.toString(),
};
exports.rdiv_token = {
    type: TokenType.rdiv,
    value: TokenType.rdiv.toString(),
};
exports.larrow_token = {
    type: TokenType.larrow,
    value: TokenType.larrow.toString()
};
exports.rarrow_token = {
    type: TokenType.rarrow,
    value: TokenType.rarrow.toString()
};
exports.pow_token = {
    type: TokenType.pow,
    value: TokenType.pow.toString()
};
function isSymbolToken(token) {
    return typeof token.value === "string";
}
exports.isSymbolToken = isSymbolToken;
function isNumericToken(token) {
    return typeof token.value === "number" && token.type == TokenType.num;
}
exports.isNumericToken = isNumericToken;
//# sourceMappingURL=token.js.map