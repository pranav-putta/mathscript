import { ArithmeticError } from "../errors";
import { TokenType } from "../token";

export interface Result {
  result: Computable;
  message?: string;
}

export abstract class Computable {
  public abstract add(other: Computable): Result;
  public abstract sub(other: Computable): Result;
  public abstract mul(other: Computable): Result;
  public abstract div(other: Computable): Result;
  public abstract rdiv(other: Computable): Result;
  public abstract pow(other: Computable): Result;

  public static compute(
    a: Computable,
    b: Computable,
    operator: TokenType
  ): Result {
    switch (operator) {
      case TokenType.plus:
        return a.add(b);
      case TokenType.minus:
        return a.sub(b);
      case TokenType.mul:
        return a.mul(b);
      case TokenType.div:
        return a.div(b);
      case TokenType.rdiv:
        return a.rdiv(b);
      default:
        throw new ArithmeticError("unsupported operation: " + operator);
    }
  }
}

/**
 * checks if given element is of type computable
 * @param el any element
 */
export function isComputable(el: any): el is Computable {
  return el instanceof Computable;
}

export { Matrix, UnevaluatedMatrix, isMatrix } from "./matrix";
export { Numeric, isNumeric } from "./numeric";
export { Logical, isLogical } from "./logical";
