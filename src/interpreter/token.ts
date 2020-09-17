/**
 * supported token characters
 */
enum TokenType {
  num,
  reserved,
  primitive,
  id,
  eof,
  and_bool = "&&",
  or_bool = "||",
  rdiv = "//",
  plus = "+",
  minus = "-",
  mul = "*",
  pow = "^",
  div = "/",
  lparen = "(",
  rparen = ")",
  lbracket = "[",
  rbracket = "]",
  larrow = "<",
  rarrow = ">",
  semicolon = ";",
  comma = ",",
  assign = "=",
  bar = "|",
  dot = ".",
  endl = "\n",
  and = "&",
  or = "|",
}

/**
 * holds a token of type with value
 * should not be used on its own, rather use aliases @type{SymbolToken, NumericToken, BooleanToken}
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
 * token holds a boolean value
 */
export type BooleanToken = IToken<boolean>;

/**
 * supported tokens
 */
export type Token = SymbolToken | NumericToken | BooleanToken;

function newToken(type: TokenType, value?: string | number | boolean): Token {
  return { type: type, value: value || type.toString() };
}

function isSymbolToken(token: Token): token is SymbolToken {
  return typeof token.value === "string";
}

function isNumericToken(token: Token): token is NumericToken {
  return typeof token.value === "number" && token.type == TokenType.num;
}

export { TokenType, isSymbolToken, isNumericToken, newToken };
