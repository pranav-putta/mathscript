use std::collections::HashMap;
use crate::vm::{SymbolValue, VirtualMachine, OpCode, InterpretResult, Func};
use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use crate::lexer::{TokenValue, Token};
use std::rc::Rc;
use std::cell::RefCell;
use bigdecimal::BigDecimal;
use std::ops::{Mul, MulAssign, SubAssign, Sub};
use num_bigint::BigInt;

pub struct Interpreter {
    global: Vec<SymbolValue>,
    stack: Vec<SymbolValue>,
    err: bool,
    err_message: String,
    scope: usize,
    pub output: Vec<(usize, String)>,
}

impl Interpreter {
    pub fn new() -> Interpreter {
        return Interpreter {
            global: Vec::new(),
            stack: Vec::new(),
            err: false,
            err_message: String::new(),
            scope: 0,
            output: Vec::new(),
        };
    }
    fn load(&mut self, ptr: usize, global: bool) {
        if global {
            if ptr as isize == -1 {
                self.global.push(SymbolValue::Null);
                self.stack.push(SymbolValue::Null);
            } else {
                self.stack.push(self.global[ptr].clone());
            }
        } else {
            if ptr as isize == -1 {
                self.stack.push(SymbolValue::Null);
            } else {
                let index = self.stack.len() - ptr;
                self.stack.push(self.stack[index].clone());
            }
        }
    }

    fn store(&mut self, ptr: usize, global: bool, value: SymbolValue) {
        if global {
            if ptr as isize != -1 {
                self.global[ptr] = value.clone();
            } else {
                self.global.push(value.clone());
            }
            self.stack.push(value);
        } else {
            if ptr as isize != -1 {
                self.stack[ptr] = value.clone();
            }
            self.stack.push(value);
        }
    }

    fn dims(&self, vec: &Vec<Vec<SymbolValue>>) -> (usize, usize) {
        let rows = vec.len();
        return if rows == 0 {
            (0, 0)
        } else {
            let cols = vec[0].len();
            (rows, cols)
        };
    }

    fn add(&self, a: SymbolValue, b: SymbolValue) -> Result<SymbolValue, InterpretResult> {
        return if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
            Ok(SymbolValue::Num((a + b)))
        } else if let (SymbolValue::Matrix(a), SymbolValue::Matrix(b)) = (&a, &b) {
            let dim_a = self.dims(a);
            let dim_b = self.dims(b);
            if dim_a == dim_b {
                let mut output = Vec::new();
                for i in 0..dim_a.0 {
                    let mut row = Vec::new();
                    for j in 0..dim_a.1 {
                        let result = self.add(a[i][j].clone(), b[i][j].clone());
                        match result {
                            Ok(val) => {
                                row.push(val);
                            }
                            Err(err) => {
                                return Err(err);
                            }
                        }
                    }
                    output.push(row);
                }
                Ok(SymbolValue::Matrix(output))
            } else {
                Err(InterpretResult::RuntimeError(String::from(format!("could not add matrices of dimensions '{:?}' and '{:?}'", dim_a, dim_b))))
            }
        } else if let (SymbolValue::Tuple(a), SymbolValue::Tuple(b)) = (&a, &b) {
            let dim_a = a.len();
            let dim_b = b.len();
            return if dim_a == dim_b {
                let mut output = Vec::new();
                for i in 0..dim_a {
                    let out = (self.add(a[i].clone(), b[i].clone()));
                    match out {
                        Ok(val) => {
                            output.push(val);
                        }
                        Err(err) => {
                            return Err(err);
                        }
                    }
                }
                Ok(SymbolValue::Tuple(output))
            } else {
                Err(InterpretResult::RuntimeError(String::from(format!("could not add tuples of dimensions '{:?}' and '{:?}'", dim_a, dim_b))))
            };
        } else {
            Err(InterpretResult::RuntimeError(String::from(format!("could not add '{}' and '{}'", a, b))))
        };
    }

    /// begins interpreting the instruction set
    pub fn interpret(&mut self, mut vm: VirtualMachine) -> InterpretResult {
        loop {
            if vm._ip >= vm.instructions.len() {
                return InterpretResult::RuntimeError(String::from("expected a return"));
            }

            let instruction = vm.next_instruction();
            // check for argument errors

            match FromPrimitive::from_usize(instruction) {
                Some(OpCode::Constant) => {
                    let const_idx = vm.next_instruction();
                    let value = &vm.consts[const_idx];

                    match value {
                        TokenValue::Number(n) => {
                            self.stack.push(SymbolValue::Num(n.clone()))
                        }
                        TokenValue::String(s) => {
                            self.stack.push(SymbolValue::Str(s.clone()))
                        }
                    }
                }
                Some(OpCode::Symbol) => {
                    let offset = vm.next_instruction();
                    let global = vm.next_instruction() == 1;
                    let name_ptr = vm.next_instruction();
                    let name = vm.consts[name_ptr].clone();
                    if let TokenValue::String(str) = name {
                        print!("");
                    }
                    self.stack.push(SymbolValue::Pointer { global, ptr: offset });
                }
                Some(OpCode::And) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Bool(a), SymbolValue::Bool(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Bool(*a && *b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not subtract '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::Load) => {
                    let offset = self.stack.pop().unwrap();
                    if let SymbolValue::Pointer { ptr, global } = offset {
                        self.load(ptr, global);
                    } else {
                        return InterpretResult::RuntimeError(String::from("expected a memory address to load"));
                    }
                }
                Some(OpCode::Assign) => {
                    let value = self.stack.pop().unwrap();
                    let offset = self.stack.pop().unwrap();
                    if let SymbolValue::Pointer { ptr, global } = offset {
                        self.store(ptr, global, value);
                    } else {
                        return InterpretResult::RuntimeError(String::from("expected a memory address to assign"));
                    }
                }
                Some(OpCode::UnaryPos) => {}
                Some(OpCode::UnaryNeg) => {
                    let a = self.stack.pop().unwrap();

                    if let SymbolValue::Num(a) = a {
                        self.stack.push(SymbolValue::Num(-a));
                    }
                }
                Some(OpCode::UnaryNot) => {}
                Some(OpCode::Add) => {
                    let a = self.stack.pop().unwrap();
                    let b = self.stack.pop().unwrap();

                    let out = self.add(a, b);
                    match out {
                        Ok(val) => {
                            self.stack.push(val);
                        }
                        Err(err) => {
                            return err;
                        }
                    }
                }
                Some(OpCode::Sub) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Num(a - b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not subtract '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::Mul) => {
                    let a = self.stack.pop().unwrap();
                    let b = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Num(a * b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not multiply '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::Div) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Num(a / b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not divide '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::Pow) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Num(a * b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not pow '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::Or) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Bool(a), SymbolValue::Bool(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Bool(*a || *b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not or '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::Print) => {
                    let line = vm.lines[vm._ip - 1] - 1;
                    if self.stack.len() >= 1 {
                        self.output.push((line, self.stack.last().unwrap().clone().to_string()));
                    } else {
                        self.output.push((line, String::from("null")));
                    }
                }
                Some(OpCode::Branch) => {
                    let b = self.stack.pop().unwrap();
                    let ptr = vm.next_instruction();

                    if let SymbolValue::Bool(b) = &b {
                        if !*b {
                            vm._ip = ptr;
                        }
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("cannot perform ternary operation on non-boolean expression: '{}'", b)));
                    }
                }
                Some(OpCode::Tuple) => {
                    let mut tuple: Vec<SymbolValue> = Vec::new();
                    let size = vm.next_instruction();
                    for _ in 0..size {
                        tuple.push(self.stack.pop().unwrap());
                    }
                    tuple.reverse();
                    self.stack.push(SymbolValue::Tuple(tuple));
                }
                Some(OpCode::Matrix) => {
                    let mut matrix = Vec::new();
                    let rows = vm.next_instruction();
                    let cols = vm.next_instruction();

                    for _ in 0..rows {
                        let mut row = Vec::new();
                        for _ in 0..cols {
                            row.push(self.stack.pop().unwrap());
                        }
                        row.reverse();
                        matrix.push(row);
                    }
                    matrix.reverse();
                    self.stack.push(SymbolValue::Matrix(matrix));
                }
                Some(OpCode::FnDecl) => {
                    let args = vm.next_instruction();
                    let offset = self.stack.pop().unwrap();
                    let start = self.stack.len() - vm.next_instruction();

                    if let (SymbolValue::Pointer { ptr, global }) = offset {
                        let mut closure = Func {
                            args,
                            ptr: vm._ip + 2,
                            closure_stack: Vec::from(&self.stack[start..]),
                        };
                        let closure_pointer = Rc::new(RefCell::new(closure));
                        if !global {
                            {
                                let mut closure_ref = closure_pointer.borrow_mut();
                                (*closure_ref).closure_stack.remove(0);
                                (*closure_ref).closure_stack.push(SymbolValue::Func(closure_pointer.clone()));
                            }
                        }
                        self.store(ptr, global, SymbolValue::Func(closure_pointer.clone()));
                    }
                }
                Some(OpCode::Return) => {
                    let offset = vm.next_instruction();
                    let last = self.stack.pop().unwrap();
                    for _ in 0..(offset) {
                        self.stack.pop().unwrap();
                    }

                    let return_addr = self.stack.pop().unwrap();
                    self.stack.push(last);
                    if let SymbolValue::Pointer { ptr, global } = return_addr {
                        vm._ip = ptr;
                    } else {
                        return InterpretResult::RuntimeError(String::from("expected pointer to return address"));
                    }
                }
                Some(OpCode::FnCall) => {
                    let num_args = vm.next_instruction();
                    let mut arg_values = Vec::new();
                    for i in 0..num_args {
                        arg_values.push(self.stack.pop().unwrap());
                    }
                    arg_values.reverse();
                    let func_ptr = self.stack.pop().unwrap();

                    if let SymbolValue::Func(ptr) = func_ptr {
                        let func = ptr.borrow();
                        if func.args != num_args {
                            return InterpretResult::RuntimeError(String::from("incorrect number of arguments"));
                        }
                        self.stack.push(SymbolValue::Pointer { ptr: vm._ip, global: false });
                        self.stack.extend(func.closure_stack.clone());

                        vm._ip = func.ptr;

                        for val in arg_values {
                            self.stack.push(val);
                        }
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("couldn't call '{}'", func_ptr)));
                    }
                }
                Some(OpCode::BeginScope) => {
                    self.scope += 1;
                }
                Some(OpCode::EndScope) => {
                    self.scope -= 1;
                }
                Some(OpCode::Jump) => {
                    let loc = vm.next_instruction();
                    vm._ip = loc;
                }
                Some(OpCode::EndProgram) => {
                    return InterpretResult::Ok;
                }
                Some(OpCode::LessThan) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Bool(a < b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not compare '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::MoreThan) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Bool(a > b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not compare '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::LessEqThan) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Bool(a <= b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not compare '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::MoreEqThan) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Bool(a >= b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not compare '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::Eq) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Bool(a == b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not compare '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::NotEq) => {
                    let b = self.stack.pop().unwrap();
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a), SymbolValue::Num(b)) = (&a, &b) {
                        self.stack.push(SymbolValue::Bool(a != b));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not compare '{}' and '{}'", a, b)));
                    }
                }
                Some(OpCode::Factorial) => {
                    let a = self.stack.pop().unwrap();

                    if let (SymbolValue::Num(a)) = &a {
                        if !a.is_integer() {
                            return InterpretResult::RuntimeError(String::from("cannot take factorial of decimal"));
                        }
                        let mut value = a.clone();
                        let mut out = BigDecimal::from(1);
                        while value >= BigDecimal::from(1) {
                            out.mul_assign(value.clone());
                            value = value.sub(BigDecimal::from(1));
                        }
                        self.stack.push(SymbolValue::Num(out));
                    } else {
                        return InterpretResult::RuntimeError(String::from(format!("could not fact '{}' and", a)));
                    }
                }
                _ => {}
            }
        }
    }
}