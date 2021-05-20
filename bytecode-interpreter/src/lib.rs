mod compiler;
mod interpreter;
mod lexer;
mod vm;

use compiler::Compiler;
use interpreter::Interpreter;
use vm::SymbolValue;
use vm::InterpretResult;
use wasm_bindgen::JsValue;
use wasm_bindgen::closure;
use serde::Serialize;
use wasm_bindgen::prelude::*;


#[wasm_bindgen]
#[derive(Serialize)]
struct InterpretOutput {
    disassembly: Vec<String>,
    asm: Vec<usize>,
    output: Vec<(usize, String)>,
    result: InterpretResult,
}

#[wasm_bindgen]
pub fn lib_interpret(text: &str) -> JsValue {
    let mut c = Compiler::new(text);
    c.compile();
    let disassembly = c.vm.disassemble(false);
    let asm = c.vm.instructions.clone();
    c.vm.reset();

    let mut interpreter = Interpreter::new();

    let result = interpreter.interpret(c.vm);
    let mut output = interpreter.output;

    let iout = InterpretOutput { output, disassembly, result, asm };
    JsValue::from_serde(&iout).unwrap()
}