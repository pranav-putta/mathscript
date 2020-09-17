import { AST } from "./ast";
import { rref, transpose, det, sqrt, identity } from "./functions";

type Function = (...args: any[]) => any;

interface GlobalVariables {
  [key: string]: any;
}
interface GlobalProcedures {
  [key: string]: Function;
}

export let global_scope: GlobalVariables = {};
export let global_functions: GlobalProcedures = {
  rref: rref,
  trans: transpose,
  transpose: transpose,
  det: det,
  determinant: det,
  q: sqrt,
  sqrt: sqrt,
  identity: identity,
};

export function executeFunction(f: string, args: AST[]) {
  let func = global_functions[f];
  let params = [];
  for (let arg of args) {
    params.push(arg.eval());
  }
  func.call(params);
}
