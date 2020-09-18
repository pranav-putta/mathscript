export class SyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenError";
  }
}

export class SymbolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SymbolError";
  }
}

export class ArithmeticError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArithmeticError";
  }
}

export class MatrixError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatrixError";
  }
}

export class ParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParsingError";
  }
}

export class UndeclaredVariableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UndeclaredVariableError";
  }
}

export class ArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArgumentError";
  }
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}
