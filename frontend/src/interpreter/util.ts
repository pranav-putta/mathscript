import { ArithmeticError } from "./errors";

/**
 * checks if given text contains only whitespace
 * @param text input character
 */
export function isspace(text: string): boolean {
  return text == " " || text == "\t";
}

/**
 * checks if given text is an alphanumeric
 * @param text input character
 */
export function isalnum(text: string): boolean {
  return text.match(/^[a-z0-9]+$/i) !== null;
}

/**
 * checks if given text contains a digit
 * @param text input character
 */
export function isdigit(text: string): boolean {
  return !isNaN(parseInt(text));
}

/**
 * returns the positive modulo of the two numbers
 * @param a first integer
 * @param b second integer
 */
export function mod(a: number, b: number): number {
  if (!Number.isInteger(b)) {
    throw new ArithmeticError("expected an integer for mod");
  }
  let out = a % b;
  return out >= 0 ? out : out + b;
}

/**
 * circular array backed queue implementation
 */
export class Queue<E> {
  private data: E[];
  private _size: number;
  private front: number;

  private readonly INITIAL_CAPACITY = 9;

  constructor() {
    this.data = new Array(this.INITIAL_CAPACITY);
    this._size = 0;
    this.front = 0;
  }

  public get size(): number {
    return this._size;
  }

  /**
   * inserts all data in array to the back of the queue
   * @param data data array to insert
   */
  public pushAll(data: E[]) {
    data.forEach((val: E) => {
      this.push(val);
    });
  }

  /**
   * inserts data into back of queue
   * @param data data to insert
   */
  public push(data: E) {
    if (this._size == this.data.length) {
      let temp: E[] = new Array(this.size * 2);
      temp[0] = data;
      for (var i = 0; i < this.size; i++) {
        temp[i + 1] = this.data[(this.front + i) % this.size];
      }
      this.data = temp;
      this.front = 0;
    } else {
      this.data[(this.front + this._size) % this.data.length] = data;
    }
    this._size++;
  }

  /**
   * returns next element in queue
   * @returns E if object found, undefined otherwise
   */
  public peek(): E | undefined {
    if (this.size > 0) {
      return this.data[this.front];
    }

    return undefined;
  }

  /**
   * removes current element in queue and returns
   * @returns E if object found, undefined otherwise
   */
  public pop(): E | undefined {
    if (this.size > 0) {
      let out: E = this.data[this.front];
      this.front = (this.front + 1) % this.data.length;
      this._size--;
      return out;
    }

    return undefined;
  }
}
