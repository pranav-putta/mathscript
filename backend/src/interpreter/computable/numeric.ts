import { Computable, Result, isMatrix } from "./";
import { ArithmeticError } from "../errors";

export class Numeric extends Computable {
  value: number;

  constructor(val: number) {
    super();
    this.value = val;
  }

  private error(): never {
    throw new ArithmeticError("cannot add numeric with non-numeric");
  }

  public add(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(this.value + other.value) };
    } else if (isMatrix(other)) {
      return other.add(this);
    }
    this.error();
  }

  public sub(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(this.value - other.value) };
    } else if (isMatrix(other)) {
      return other.sub(this);
    }
    this.error();
  }

  public mul(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(this.value * other.value) };
    } else if (isMatrix(other)) {
      return other.mul(this);
    }
    this.error();
  }

  public div(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(this.value / other.value) };
    } else if (isMatrix(other)) {
      return other.div(this);
    }
    this.error();
  }

  public rdiv(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(Math.floor(this.value / other.value)) };
    } else if (isMatrix(other)) {
      return other.rdiv(this);
    }
    this.error();
  }

  public pow(other: Computable): Result {
    if (isNumeric(other)) {
      return { result: new Numeric(Math.pow(this.value, other.value)) };
    }
    this.error();
  }
}

export function isNumeric(el: any): el is Numeric {
  return el instanceof Numeric;
}