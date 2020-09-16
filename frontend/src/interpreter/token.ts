/**
 * supported token characters
 */
enum TokenType {
  num = "num",
  plus = "+",
  minus = "-",
  mul = "*",
  pow = "^",
  div = "/",
  rdiv = "//",
  lparen = "(",
  rparen = ")",
  lbracket = "[",
  rbracket = "]",
  larrow = "<",
  rarrow = ">",
  semicolon = ";",
  comma = ",",
  space = "~",
  assign = "=",
  bar = "|",
  dot = ".",
  endl = "\n",
  id = "id",
  eof = "eof",
}

/**
 * holds a token of type with value
 * should not be used on its own, rather use aliases @type{SymbolToken, NumericToken, MatrixToken}
 */
interface IToken<E> {
  type: TokenType;
  value: E;
}

/**
 * token holds a symbol like +, -, *, /, etc.
 */
export type SymbolToken = IToken<string>;
/**
 * token holds a numeric value
 */
export type NumericToken = IToken<number>;

/**
 * supported tokens
 */
export type Token = SymbolToken | NumericToken;

// generated tokens
export let plus_token: SymbolToken = {
  type: TokenType.plus,
  value: TokenType.plus.toString(),
};
export let minus_token: SymbolToken = {
  type: TokenType.minus,
  value: TokenType.minus.toString(),
};
export let mul_token: SymbolToken = {
  type: TokenType.mul,
  value: TokenType.mul.toString(),
};
export let div_token: SymbolToken = {
  type: TokenType.div,
  value: TokenType.div.toString(),
};
export let lparen_token: SymbolToken = {
  type: TokenType.lparen,
  value: TokenType.lparen.toString(),
};
export let rparen_token: SymbolToken = {
  type: TokenType.rparen,
  value: TokenType.rparen.toString(),
};
export let lbracket_token: SymbolToken = {
  type: TokenType.lbracket,
  value: TokenType.lbracket.toString(),
};
export let rbracket_token: SymbolToken = {
  type: TokenType.rbracket,
  value: TokenType.rbracket.toString(),
};
export let comma_token: SymbolToken = {
  type: TokenType.comma,
  value: TokenType.comma.toString(),
};
export let semicolon_token: SymbolToken = {
  type: TokenType.semicolon,
  value: TokenType.semicolon.toString(),
};
export let eof_token: SymbolToken = {
  type: TokenType.eof,
  value: TokenType.eof.toString(),
};
export let bar_token: SymbolToken = {
  type: TokenType.bar,
  value: TokenType.bar.toString(),
};
export let assign_token: SymbolToken = {
  type: TokenType.assign,
  value: TokenType.assign.toString(),
};
export let dot_token: SymbolToken = {
  type: TokenType.dot,
  value: TokenType.dot.toString(),
};
export let endl_token: SymbolToken = {
  type: TokenType.endl,
  value: TokenType.endl.toString(),
};
export let id_token: SymbolToken = {
  type: TokenType.id,
  value: TokenType.id.toString(),
};
export let rdiv_token: SymbolToken = {
  type: TokenType.rdiv,
  value: TokenType.rdiv.toString(),
};
export let larrow_token: SymbolToken = {
  type: TokenType.larrow,
  value: TokenType.larrow.toString(),
};
export let rarrow_token: SymbolToken = {
  type: TokenType.rarrow,
  value: TokenType.rarrow.toString(),
};
export let pow_token: SymbolToken = {
  type: TokenType.pow,
  value: TokenType.pow.toString(),
};

function isSymbolToken(token: Token): token is SymbolToken {
  return typeof token.value === "string";
}

function isNumericToken(token: Token): token is NumericToken {
  return typeof token.value === "number" && token.type == TokenType.num;
}

export { TokenType, isSymbolToken, isNumericToken };
