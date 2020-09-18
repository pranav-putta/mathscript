import {
  AST,
  ProcedureDefinitionNode,
  VariableNode,
  VariableScope,
} from "./ast";
import { Computable } from "./computable";
import { ParsingError, RuntimeError } from "./errors";
import { rref, transpose, det, sqrt, identity } from "./lib";
import { Stack } from "./util";

type Function = (...args: any[]) => any;

interface Variables {
  [key: string]: any;
}
interface GlobalProcedures {
  [key: string]: Function;
}
interface LocalProcedures {
  [key: string]: ProcedureDefinitionNode;
}
interface FunctionBlock {
  functionName: string;
  variables: Variables;
}

let global_scope: Variables = {};
let global_functions: GlobalProcedures = {
  rref: rref,
  trans: transpose,
  transpose: transpose,
  det: det,
  determinant: det,
  q: sqrt,
  sqrt: sqrt,
  identity: identity,
};
let local_functions: LocalProcedures = {};
let function_stack: Stack<FunctionBlock> = new Stack();

/**
 * retrieve a variable from global or local scope
 * @param name variable name
 * @param scope variable scope
 */
export function findVariable(
  name: string,
  scope: VariableScope
): any | undefined {
  let val = undefined;
  if (scope == VariableScope.global) {
    val = global_scope[name];
  } else if (scope == VariableScope.procedure) {
    let currentBlock = function_stack.peek();
    if (currentBlock) {
      val = currentBlock.variables[name];
    } else {
      throw new RuntimeError(
        "function call stack was empty, something weird happened."
      );
    }
  }
  if (val) {
    return val;
  } else {
    throw new RuntimeError(`variable ${name} wasn't declared!`);
  }
}

/**
 * sets variable to local and global scope
 * @param name variable name
 * @param value variable value
 * @param scope variable scope
 */
export function assignVariable(name: string, value: any, scope: VariableScope) {
  if (scope == VariableScope.global) {
    global_scope[name] = value;
    return value;
  } else if (scope == VariableScope.procedure) {
    let currentBlock = function_stack.peek();
    if (currentBlock) {
      currentBlock.variables[name] = value;
      return value;
    }
  }
  throw new RuntimeError(
    "function call stack was empty, something weird happened"
  );
}

/**
 * generate a variables component
 * @param vars parameter nodes
 */
function evaluateLocalFunctionParameters(params: VariableNode[], vals: AST[]): Variables {
  let variables: Variables = {};
  if (params.length != vals.length) {
    throw new RuntimeError(`expected ${params.length} parameters, but got ${vals.length}`)
  }
  for (let i = 0; i < params.length; i++) {
    variables[params[i].name] = vals[i].eval();
  }
  return variables;
}

/**
 * execute a local function
 * @param func function to execute
 */
function executeLocalFunction(f: string, args: AST[]) {
  let func = local_functions[f];
  let params = evaluateLocalFunctionParameters(func.args, args);
  function_stack.push({ functionName: func.name, variables: params });
  let out: any;
  for (let statement of func.exprs) {
    out = statement.eval();
  }
  function_stack.pop();
  return out;
}

/**
 * executes any function
 * @param f function name
 * @param args list of parameters
 */
export function executeFunction(f: string, args: AST[]) {
  if (f in global_functions) {
    let func = global_functions[f];
    let params: Computable[] = [];
    for (let arg of args) {
      params.push(arg.eval());
    }
    return func.apply(null, params);
  } else if (f in local_functions) {
    return executeLocalFunction(f, args);
  } else {
    throw new ParsingError(`function ${f} couldn't be found`);
  }
}

/**
 * create a new function
 * @param func function node
 */
export function createUserDefinedFunction(func: ProcedureDefinitionNode) {
  if (func.name in global_functions) {
    throw new ParsingError(
      "conflicting function definition name: " + func.name
    );
  }
  local_functions[func.name] = func;
}

export function clearScopes() {
  global_scope = {}
  local_functions = {}
  function_stack.clear()
}
