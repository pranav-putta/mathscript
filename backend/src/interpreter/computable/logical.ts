import { Computable, Result } from "./";
import { ArithmeticError } from "../errors";
import { Numeric } from "./numeric";

export interface LogicalResult extends Result {
  result: Logical;
}
/**
 * boolean computable value
 */
export class Logical extends Numeric {
  private boolVal: boolean;

  constructor(value: boolean) {
    super(value ? 1 : 0);
    this.boolVal = value;
  }

  public add(other: Computable): Result {
    return other.add(new Numeric(this.value));
  }
  public sub(other: Computable): Result {
    return other.add(new Numeric(this.value * -1));
  }
  public mul(other: Computable): Result {
    return other.mul(new Numeric(this.value));
  }
  public div(other: Computable): Result {
    throw new ArithmeticError("boolean division is not supported");
  }

  public rdiv(other: Computable): Result {
    throw new ArithmeticError("boolean division is not supported");
  }
  public pow(other: Computable): Result {
    throw new ArithmeticError("boolean powers not supported");
  }

  public or(other: Logical): LogicalResult {
    return { result: new Logical(this.boolVal || other.boolVal) };
  }

  public and(other: Logical): LogicalResult {
    return { result: new Logical(this.boolVal && other.boolVal) };
  }

  public xor(other: Logical): LogicalResult {
    return { result: new Logical(this.boolVal !== other.boolVal) };
  }

  public nand(other: Logical): LogicalResult {
    return {
      result: new Logical(this.boolVal == other.boolVal && !this.boolVal),
    };
  }
}

export function isLogical(el: any): el is Logical {
  return el instanceof Logical;
}
