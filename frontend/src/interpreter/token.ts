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
  and = "&",
  or = "|",
  and_bool = "&&",
  or_bool = "||",
  reserved = "reserved",
  primitive = "primitive"
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
