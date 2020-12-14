mod lexer;
mod global;
mod gparser;
mod ast;
mod symtable;
mod data;
mod errors;
mod grammar;
mod pq;
mod parser;
mod interpreter;

use wasm_bindgen::prelude::*;
use interpreter::interpret;

#[wasm_bindgen]
pub fn lib_interpret(text: &str) -> JsValue {
    let result = interpret(text);
    JsValue::from_serde(&result).unwrap()
}