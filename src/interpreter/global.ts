import { AST } from "./ast";
import { rref, transpose } from "./functions";

interface GlobalVariables {
  [key: string]: any;
}
interface GlobalProcedures {
  [key: string]: (...args: AST[]) => any;
}

export let global_scope: GlobalVariables = {};
export let global_functions: GlobalProcedures = {
  rref: rref,
  trans: transpose,
  transpose: transpose,
};
