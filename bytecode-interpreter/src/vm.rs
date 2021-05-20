use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use crate::lexer::TokenValue;

use std::fmt;
use std::collections::HashMap;
use bigdecimal::BigDecimal;
use std::fmt::Formatter;
use crate::vm::InterpretResult::RuntimeError;
use std::convert::TryInto;
use std::ptr::NonNull;
use std::rc::Rc;
use std::cell::RefCell;
use serde::Serialize;

type Value = TokenValue;

impl fmt::Display for Value {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        return match self {
            TokenValue::Number(val) => {
                write!(f, "{}", val)
            }
            TokenValue::String(val) => {
                write!(f, "{}", val)
            }
        };
    }
}

impl fmt::Display for SymbolValue {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        return match self {
            SymbolValue::Num(num) => {
                write!(f, "{}", num)
            }
            SymbolValue::Bool(b) => {
                write!(f, "{}", b)
            }
            SymbolValue::Str(s) => {
                write!(f, "{}", s)
            }
            SymbolValue::Matrix(m) => {
                write!(f, "{:?}", m)
            }
            SymbolValue::Func(func) => {
                let func = func.borrow();
                let mut stack = Vec::new();
                for item in func.closure_stack.iter() {
                    if let SymbolValue::Func(func) = item {
                        stack.push(String::from("fn<>"));
                    } else {
                        stack.push(item.to_string());
                    }
                }
                write!(f, "fn<> @{}\targs: {}\tclosure: {:?}", func.ptr, func.args, stack)
            }
            SymbolValue::Tuple(tuple) => {
                write!(f, "{:?}", tuple)
            }
            SymbolValue::Pointer { ptr, global } => {
                write!(f, "{}", ptr)
            }
            SymbolValue::Null => {
                write!(f, "NULL")
            }
        };
    }
}

impl fmt::Display for Symbol {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        return write!(f, "{}", self.name);
    }
}

#[derive(FromPrimitive, Eq, PartialEq, Clone)]
pub enum OpCode {
    Print = INSTR_OFFSET,
    Return,
    Constant,
    And,
    Or,
    Add,
    Sub,
    Mul,
    Div,
    Pow,
    Mod,
    Factorial,
    Assign,
    Symbol,
    Load,
    EndProgram,
    UnaryPos,
    UnaryNeg,
    UnaryNot,
    Tuple,
    Matrix,
    FnDecl,
    FnCall,
    Jump,
    BeginScope,
    EndScope,
    Branch,
    LessThan,
    MoreThan,
    LessEqThan,
    MoreEqThan,
    Eq,
    NotEq,
    None,
}

const INSTR_OFFSET: isize = isize::max_value() - 0xffff;

#[derive(Eq, PartialEq, Serialize)]
pub enum InterpretResult {
    Ok,
    CompileError(String),
    RuntimeError(String),
}

#[derive(Clone, Eq, PartialEq, Debug)]
pub struct Func {
    pub closure_stack: Vec<SymbolValue>,
    pub args: usize,
    pub ptr: usize,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SymbolValue {
    Num(BigDecimal),
    Bool(bool),
    Str(String),
    Matrix(Vec<Vec<SymbolValue>>),
    Func(Rc<RefCell<Func>>),
    Tuple(Vec<SymbolValue>),
    Pointer {
        global: bool,
        ptr: usize,
    },
    Null,
}

pub struct Symbol {
    name: String,
    scopes: Vec<SymbolValue>,
}

#[derive(Clone)]
pub struct Offset {
    symbols: HashMap<String, usize>,
    stack_ptr: usize,
}

pub struct VirtualMachine {
    pub instructions: Vec<usize>,
    pub lines: Vec<usize>,
    pub consts: Vec<Value>,
    pub offsets: Vec<Offset>,

    // maps identifier to its corresponding location in the constants vec
    _symbol_id_table: HashMap<String, usize>,
    pub _ip: usize,
    _func_decl: bool,
}

pub type VM = VirtualMachine;

/// VM utility implementation (private)
impl VM {
    /// returns current instruction and increments instruction pointer
    pub fn next_instruction(&mut self) -> usize {
        self._ip += 1;
        return self.instructions[self._ip - 1];
    }

    /// convert opcode into human readable code
    fn disassemble_instruction(&mut self, show_line: bool) -> String {
        // set the line indicator
        let mut line = String::from("|");
        if self._ip == 0 || self.lines[self._ip] != self.lines[self._ip - 1] {
            line = format!("{}", self.lines[self._ip]);
        } else if self._ip != 0 {
            line = format!("{:width$}", " ", width = self.lines[self._ip].to_string().len())
        }
        let instr = self.next_instruction();
        let print_instr = instr as isize - INSTR_OFFSET;
        let ip = if show_line { self._ip.to_string() + "\t" } else { String::from("") };
        return match FromPrimitive::from_usize(instr) {
            Some(OpCode::Print) => { String::from(format!("{}{:#07b} {} print\n", ip, print_instr, line)) }
            Some(OpCode::Constant) => {
                let c_idx = self.next_instruction();
                let constant = &self.consts[c_idx];
                String::from(format!("{}{:#07b}\t{} const, {:#0x} ('{}')\n", ip, print_instr, line, c_idx, constant))
            }
            Some(OpCode::Add) => {
                String::from(format!("{}{:#07b}\t{} op '+'\n", ip, print_instr, line))
            }
            Some(OpCode::Sub) => {
                String::from(format!("{}{:#07b}\t{} op '-'\n", ip, print_instr, line))
            }
            Some(OpCode::Mul) => {
                String::from(format!("{}{:#07b}\t{} op '*'\n", ip, print_instr, line))
            }
            Some(OpCode::Div) => {
                String::from(format!("{}{:#07b}\t{} op '/'\n", ip, print_instr, line))
            }
            Some(OpCode::UnaryPos) => {
                String::from(format!("{}{:#07b}\t{} op 'u+'\n", ip, print_instr, line))
            }
            Some(OpCode::UnaryNeg) => {
                String::from(format!("{}{:#07b}\t{} op 'u-'\n", ip, print_instr, line))
            }
            Some(OpCode::UnaryNot) => {
                String::from(format!("{}{:#07b}\t{} op 'u!'\n", ip, print_instr, line))
            }
            Some(OpCode::Symbol) => {
                let offset = self.next_instruction() as isize;
                let global = self.next_instruction();
                let name = self.next_instruction();
                let val = self.consts[name].clone();
                String::from(format!("{}{:#07b}\t{} ptr {}, {:#0x} ('{}')\n", ip, print_instr, line, if global == 1 { 'g' } else { 'l' }, (offset as isize), val))
            }
            Some(OpCode::Load) => {
                String::from(format!("{}{:#07b}\t{} ld\n", ip, print_instr, line))
            }
            Some(OpCode::Assign) => {
                String::from(format!("{}{:#07b}\t{} store\n", ip, print_instr, line))
            }
            Some(OpCode::EndProgram) => {
                String::from(format!("{}{:#07b}\t{} halt\n", ip, print_instr, line))
            }
            Some(OpCode::Tuple) => {
                let size = self.next_instruction();
                String::from(format!("{}{:#07b}\t{} tuple\t {}\n", ip, print_instr, line, size))
            }
            Some(OpCode::Matrix) => {
                let rows = self.next_instruction();
                let cols = self.next_instruction();
                String::from(format!("{}{:#07b}\t{} matrix\t [{} x {}]\n", ip, print_instr, line, rows, cols))
            }
            Some(OpCode::FnDecl) => {
                let num_args = self.next_instruction();
                self.next_instruction();
                String::from(format!("{}{:#07b}\t{} fn_decl, fn<args: {}>\n", ip, print_instr, line, num_args))
            }
            Some(OpCode::FnCall) => {
                let args = self.next_instruction();
                String::from(format!("{}{:#07b}\t{} fn_call, fn<args: {}>\n", ip, print_instr, line, args))
            }
            Some(OpCode::Jump) => {
                let addr = self.next_instruction();
                String::from(format!("{}{:#07b}\t{} jmp, {:#0x}\n", ip, print_instr, line, addr))
            }
            Some(OpCode::Return) => {
                let offset = self.next_instruction();
                String::from(format!("{}{:#07b}\t{} ret, {:#0x}\n", ip, print_instr, line, (offset as isize)))
            }
            Some(OpCode::BeginScope) => {
                //String::from(format!("{}\t{:#07b}\t{} scope_b\t", ip, print_instr, line))
                String::from("")
            }
            Some(OpCode::EndScope) => {
                //String::from(format!("{}\t{:#07b}\t{} scope_e\t", ip, print_instr, line))
                String::from("")
            }
            Some(OpCode::Pow) => {
                String::from(format!("{}{:#07b}\t{} op '^'\n", ip, print_instr, line))
            }
            Some(OpCode::LessThan) => {
                String::from(format!("{}{:#07b}\t{} op '<'\n", ip, print_instr, line))
            }
            Some(OpCode::MoreEqThan) => {
                String::from(format!("{}{:#07b}\t{} op '>='\n", ip, print_instr, line))
            }
            Some(OpCode::LessEqThan) => {
                String::from(format!("{}{:#07b}\t{} op '<='\n", ip, print_instr, line))
            }
            Some(OpCode::MoreThan) => {
                String::from(format!("{}{:#07b}\t{} op '>'\n", ip, print_instr, line))
            }
            Some(OpCode::Eq) => {
                String::from(format!("{}{:#07b}\t{} op '=='\n", ip, print_instr, line))
            }
            Some(OpCode::NotEq) => {
                String::from(format!("{}{:#07b}\t{} op '!='\n", ip, print_instr, line))
            }
            Some(OpCode::And) => {
                String::from(format!("{}{:#07b}\t{} op '&&'\n", ip, print_instr, line))
            }
            Some(OpCode::Or) => {
                String::from(format!("{}{:#07b}\t{} op '||'\n", ip, print_instr, line))
            }
            Some(OpCode::Factorial) => {
                String::from(format!("{}{:#07b}\t{} op 'f!'\n", ip, print_instr, line))
            }
            Some(OpCode::Branch) => {
                let ptr = self.next_instruction();
                String::from(format!("{}{:#07b}\t{} branch, {}\n", ip, print_instr, line, ptr))
            }
            _ => { String::from(format!("{}unknown code {:#07b}\n", ip, print_instr)) }
        };
    }
}

/// VM implementation
impl VM {
    pub fn new() -> VM {
        VM {
            instructions: Vec::new(),
            consts: Vec::new(),
            lines: Vec::new(),
            offsets: vec![Offset { symbols: HashMap::new(), stack_ptr: 0 }],
            _symbol_id_table: HashMap::new(),
            _ip: 0,
            _func_decl: false,
        }
    }


    /// disassembles and prints the entire instruction set
    pub fn disassemble(&mut self, print: bool) -> Vec<String> {
        let mut disassembly = Vec::new();
        while self._ip < self.instructions.len() {
            let line = format!("{}", self.disassemble_instruction(print));
            if print {
                print!("{}", line);
            }
            disassembly.push(line);
        }

        return disassembly;
    }


    /// resets the instruction pointer back to 0
    pub fn reset(&mut self) {
        self._ip = 0;
    }
}

impl VM {
    /// write return instruction into virtual machine
    pub fn emit_return(&mut self, line: usize) {
        self.instructions.push(OpCode::Print as usize);
        self.lines.push(line);
    }

    /// write load constant instruction into virtual machine
    pub fn emit_constant(&mut self, val: Value, line: usize) {
        self.consts.push(val);
        self.instructions.push(OpCode::Constant as usize);
        self.instructions.push(self.consts.len() - 1);
        self.lines.push(line);
        self.lines.push(line);
        self.modify_offset(1);
    }

    pub fn modify_offset(&mut self, change: isize) {
        let offset = self.offsets.last_mut().unwrap();
        offset.stack_ptr = (offset.stack_ptr as isize + change) as usize;
    }

    pub fn remove_offset(&mut self, id: String) {
        let offset = self.offsets.last_mut().unwrap();
        offset.symbols.remove(id.as_str());
    }

    fn count_stack_ptrs(&self) -> usize {
        let mut count = 0;
        for i in 1..self.offsets.len() {
            count += self.offsets[i].stack_ptr - 1;
        }
        return count;
    }

    pub fn emit_instruction(&mut self, op: OpCode, line: usize) {
        self.instructions.push(op.clone() as usize);
        self.lines.push(line);

        match op {
            OpCode::Print => {}
            OpCode::Return => {
                let o = self.count_stack_ptrs();
                self.instructions.push(o);
                self.lines.push(line);
                self.offsets.pop();
                self.modify_offset(-1);
            }
            OpCode::Constant => {}
            OpCode::Add => {
                self.modify_offset(-1);
            }
            OpCode::Sub => {
                self.modify_offset(-1);
            }
            OpCode::Mul => {
                self.modify_offset(-1);
            }
            OpCode::Div => {
                self.modify_offset(-1);
            }
            OpCode::Pow => {
                self.modify_offset(-1);
            }
            OpCode::Mod => {
                self.modify_offset(-1);
            }
            OpCode::Assign => {
                self.modify_offset(-1);
            }
            OpCode::And => {
                self.modify_offset(-1);
            }
            OpCode::Symbol => {}
            OpCode::Load => {}
            OpCode::EndProgram => {}
            OpCode::UnaryPos => {}
            OpCode::UnaryNeg => {}
            OpCode::UnaryNot => {}
            OpCode::Tuple => {}
            OpCode::Matrix => {}
            OpCode::FnDecl => {}
            OpCode::FnCall => {}
            OpCode::Jump => {}
            OpCode::BeginScope => {
                if !self._func_decl {
                    self.offsets.push(Offset { stack_ptr: 0, symbols: HashMap::new() })
                } else {
                    self._func_decl = false;
                }
            }
            OpCode::EndScope => {
                //self.offsets.pop();
            }
            OpCode::Branch => {
                self.modify_offset(-1);
            }
            OpCode::None => {}
            OpCode::LessThan => {
                self.modify_offset(-1);
            }
            OpCode::MoreThan => {
                self.modify_offset(-1);
            }
            OpCode::LessEqThan => {
                self.modify_offset(-1);
            }
            OpCode::MoreEqThan => {
                self.modify_offset(-1);
            }
            OpCode::Eq => {
                self.modify_offset(-1);
            }
            OpCode::NotEq => {
                self.modify_offset(-1);
            }
            OpCode::Factorial => {}
            OpCode::Or => {
                self.modify_offset(-1);
            }
        }
    }

    pub fn emit_symbol(&mut self, id: String, line: usize) {
        self.instructions.push(OpCode::Symbol as usize);


        let mut loc = 0;
        if self._symbol_id_table.contains_key(id.as_str()) {
            loc = self._symbol_id_table[id.as_str()];
        } else {
            self.consts.push(Value::String(id.clone()));
            loc = self.consts.len() - 1;
            self._symbol_id_table.insert(id.clone(), loc);
        }

        // search for symbol in table
        let mut i = (self.offsets.len() - 1) as isize;
        let mut ptr: isize = 0;
        while i > 0 {
            let offset = &self.offsets[i as usize];
            if offset.symbols.contains_key(id.as_str()) {
                let off = ptr + offset.stack_ptr as isize - offset.symbols[id.as_str()] as isize;
                self.instructions.push(off as usize);
                break;
            }
            ptr += offset.stack_ptr as isize - 1;
            i -= 1;
        }

        if i == 0 { // global
            let offset = self.offsets.first().unwrap();

            if offset.symbols.contains_key(id.as_str()) {
                // symbol is in global scope, pull
                let off = offset.symbols[id.as_str()];
                self.instructions.push(off as usize);
                self.instructions.push(1);
            } else if self.offsets.len() == 1 {
                // add symbol to global scope
                let off: isize = -1;
                let offset = self.offsets.last_mut().unwrap();
                offset.symbols.insert(id, offset.symbols.len());
                self.instructions.push(off as usize);
                self.instructions.push(1);
            } else {
                // add symbol to a scope
                let offset = self.offsets.last_mut().unwrap();
                let off: isize = -1;
                offset.symbols.insert(id, offset.stack_ptr);
                self.instructions.push(off as usize);
                self.instructions.push(0);
            }
        } else {
            // symbol has already been found in a scope above global
            self.instructions.push(0);
        }


        // add name pointer
        self.instructions.push(loc);
        self.modify_offset(1);
        self.lines.push(line);
        self.lines.push(line);
        self.lines.push(line);
        self.lines.push(line);
    }

    pub fn emit_tuple(&mut self, size: usize, line: usize) {
        self.instructions.push(OpCode::Tuple as usize);
        self.instructions.push(size);
        self.lines.push(line);
        self.lines.push(line);
        self.modify_offset(-(size as isize) + 1);
    }

    pub fn emit_matrix(&mut self, rows: usize, cols: usize, line: usize) {
        self.instructions.push(OpCode::Matrix as usize);
        self.instructions.push(rows);
        self.instructions.push(cols);
        self.lines.push(line);
        self.lines.push(line);
        self.lines.push(line);
        self.modify_offset((rows * cols) as isize * -1);
        self.modify_offset(1); // matrix call
    }


    pub fn emit_func_decl(&mut self, ids: Vec<String>, line: usize) {
        self.instructions.push(OpCode::FnDecl as usize);
        self.modify_offset(1);
        let last_off = if self.offsets.len() == 1 { 0 } else { self.count_stack_ptrs() };
        self.offsets.push(Offset { symbols: HashMap::new(), stack_ptr: 0 });
        let offset = self.offsets.last_mut().unwrap();
        for i in 0..ids.len() {
            offset.symbols.insert(ids[i].clone(), i);
        }
        offset.stack_ptr += ids.len(); // arguments and return address and previous stack
        self.instructions.push(ids.len());
        self.instructions.push(last_off);
        self.lines.push(line);
        self.lines.push(line);
        self.lines.push(line);
        self._func_decl = true;
    }
    pub fn emit_func_call(&mut self, args: usize, line: usize) {
        self.instructions.push(OpCode::FnCall as usize);
        self.instructions.push(args);
        self.lines.push(line);
        self.lines.push(line);

        // modify offset
        self.modify_offset(-(args as isize)); // removing all arguments
        self.modify_offset(-1); // function pointer
        self.modify_offset(1); // for return value
    }
}

