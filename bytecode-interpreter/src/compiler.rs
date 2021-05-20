use std::collections::HashMap;
use crate::lexer::{TokenType, Lexer, TokenValue};
use lazy_static::lazy_static;
use crate::vm::{VM, OpCode};
use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use crate::vm::OpCode::Return;
use crate::compiler::Precedence::Eof;


pub struct Compiler {
    source: String,
    lexer: Lexer,
    pub vm: VM,
    last_pointer: usize,
}

#[derive(Copy, Clone, PartialEq, Debug, Eq, Hash, FromPrimitive)]
enum Precedence {
    Eof = 0,
    EndLine,
    None,
    // =
    Assignment,
    // ,
    Tuple,
    // []
    Matrix,

    // ? :
    Ternary,
    // or
    Or,
    // and
    And,
    // == !=
    Equality,
    // < > <= >=
    Comparison,
    // + -
    Term,
    // * /
    Factor,
    // ! -
    Unary,
    // . ()
    Call,
    Primary,
}

enum ParseRuleFn {
    Func(fn(&mut Compiler)),
    Null,
}

struct ParseRule {
    prefix: ParseRuleFn,
    infix: ParseRuleFn,
    prec: Precedence,
}

type PRF = ParseRuleFn;


impl Compiler {
    pub fn new(text: &str) -> Compiler {
        return Compiler { source: String::from(text), lexer: Lexer::new(text), vm: VM::new(), last_pointer: 0 };
    }

    fn parse_rules(&self, token: TokenType) -> ParseRule {
        return match token {
            TokenType::Num => { ParseRule { prefix: PRF::Func(Compiler::number), infix: PRF::Null, prec: Precedence::None } }
            TokenType::Id => { ParseRule { prefix: PRF::Func(Compiler::identifier), infix: PRF::Null, prec: Precedence::None } }
            TokenType::Plus => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Term } }
            TokenType::Minus => { ParseRule { prefix: PRF::Func(Compiler::unary), infix: PRF::Func(Compiler::binary), prec: Precedence::Term } }
            TokenType::Mul => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Factor } }
            TokenType::Div => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Factor } }
            TokenType::Pow => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Unary } }
            TokenType::Assign => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Assignment } }
            TokenType::Comma => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::tuple), prec: Precedence::Tuple } }
            TokenType::LBracket => { ParseRule { prefix: PRF::Func(Compiler::matrix), infix: PRF::Null, prec: Precedence::Matrix } }
            TokenType::LParen => { ParseRule { prefix: PRF::Func(Compiler::grouping), infix: PRF::Func(Compiler::fn_decl), prec: Precedence::Call } }
            TokenType::DQuote => { ParseRule { prefix: PRF::Func(Compiler::string), infix: PRF::Null, prec: Precedence::None } }
            TokenType::EndL => { ParseRule { prefix: PRF::Null, infix: PRF::Null, prec: Precedence::EndLine } }
            TokenType::LBrace => { ParseRule { prefix: PRF::Func(Compiler::block), infix: PRF::Null, prec: Precedence::None } }
            TokenType::Ternary => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::ternary), prec: Precedence::Ternary } }
            TokenType::Colon => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::ternary), prec: Precedence::Ternary } }
            TokenType::LArrow => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Comparison } }
            TokenType::RArrow => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Comparison } }
            TokenType::LessEq => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Comparison } }
            TokenType::MoreEq => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Comparison } }
            TokenType::Eq => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Equality } }
            TokenType::NotEq => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Equality } }
            TokenType::Eof => { ParseRule { prefix: PRF::Null, infix: PRF::Null, prec: Precedence::Eof } }
            TokenType::AndBool => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::And } }
            TokenType::OrBool => { ParseRule { prefix: PRF::Null, infix: PRF::Func(Compiler::binary), prec: Precedence::Or } }
            TokenType::NotUnary => { ParseRule { prefix: PRF::Func(Compiler::unary), infix: PRF::Func(Compiler::factorial), prec: Precedence::Unary } }
            _ => { ParseRule { prefix: PRF::Null, infix: PRF::Null, prec: Precedence::None } }
        };
    }

    fn empty(&mut self) {}

    fn factorial(&mut self) {
        self.vm.emit_instruction(OpCode::Factorial, self.lexer.prev_token.line);
    }

    fn ternary(&mut self) {
        self.vm.emit_instruction(OpCode::Branch, self.lexer.prev_token.line);
        self.vm.emit_instruction(OpCode::Jump, self.lexer.prev_token.line);
        let loc_jump_in_branch = self.vm.instructions.len() - 1;

        let mut table = self.vm.offsets.clone();
        // collect left side of ternary
        self.compile_precedence(FromPrimitive::from_usize(Precedence::Ternary as usize + 1).unwrap());
        self.vm.offsets = table.clone();

        // set jump branch
        self.vm.emit_instruction(OpCode::Jump, self.lexer.prev_token.line);
        self.vm.emit_instruction(OpCode::Jump, self.lexer.prev_token.line);
        let loc_jump_out_branch = self.vm.instructions.len() - 1;

        self.vm.instructions[loc_jump_in_branch] = self.vm.instructions.len();

        // consume colon
        self.consume(TokenType::Colon);

        // collect right side of ternary
        self.compile_precedence(Precedence::None);
        self.vm.instructions[loc_jump_out_branch] = self.vm.instructions.len();
    }

    fn consume(&mut self, token: TokenType) -> bool {
        self.lexer.next_token();

        if self.lexer.cur_token.token == token {
            return true;
        }
        return false;
    }

    fn fn_decl(&mut self) {
        let table = self.vm.offsets.clone();
        let mut num_args = 0;
        loop {
            if self.lexer.cur_token.token == TokenType::RParen {
                break;
            } else if self.lexer.cur_token.token == TokenType::Eof {
                return;
            }
            self.compile_precedence(FromPrimitive::from_usize(Precedence::Tuple as usize + 1).unwrap());
            num_args += 1;
            if self.lexer.cur_token.token != TokenType::RParen {
                self.lexer.next_token();
            }
        }
        self.consume(TokenType::RParen);

        // function declaration, otherwise function call
        if self.lexer.cur_token.token == TokenType::Assign {
            self.vm.offsets = table;
            let mut ids = Vec::new();
            for i in 0..num_args {
                self.remove_last_load();
                let name_ptr = self.vm.instructions.pop().unwrap();
                let name = self.vm.consts[name_ptr].clone();
                if let TokenValue::String(name) = name {
                    ids.push(name);
                }
                self.vm.instructions.pop();
                self.vm.instructions.pop();
                self.vm.instructions.pop();
                self.vm.lines.pop();
                self.vm.lines.pop();
                self.vm.lines.pop();
            }
            self.remove_last_load();
            ids.reverse();
            self.vm.emit_func_decl(ids, self.lexer.prev_token.line);

            self.vm.emit_instruction(OpCode::Jump, self.lexer.prev_token.line);
            self.vm.emit_instruction(OpCode::Jump, self.lexer.prev_token.line);
            let instr_partial = self.vm.instructions.len() - 1;
            self.lexer.next_token();
            let mut ptr = self.vm.instructions.len() - 1;
            while self.lexer.prev_token.token == TokenType::EndL {
                self.lexer.next_token();
            }
            if self.lexer.cur_token.token != TokenType::LBrace {
                self.vm.emit_instruction(OpCode::BeginScope, self.lexer.cur_token.line);
            }
            self.compile_precedence(FromPrimitive::from_usize(Precedence::None as usize + 1).unwrap());
            if self.vm.instructions.last().unwrap().clone() != OpCode::EndScope as usize {
                self.vm.emit_instruction(OpCode::EndScope, self.lexer.cur_token.line);
            }


            while ptr < self.vm.instructions.len() {
                if self.vm.instructions[ptr] == OpCode::Print as usize {
                    self.vm.instructions.remove(ptr);
                    self.vm.lines.remove(ptr);
                } else {
                    ptr += 1;
                }
            }
            self.vm.emit_instruction(OpCode::Return, self.lexer.prev_token.line);
            self.vm.instructions[instr_partial] = self.vm.instructions.len();
        } else {
            self.vm.emit_func_call(num_args, self.lexer.prev_token.line);
        }
        //self.vm.emit_instruction(OpCode::Print, self.lexer.prev_token.line);
    }

    fn block(&mut self) {
        self.vm.emit_instruction(OpCode::BeginScope, self.lexer.prev_token.line);

        while self.lexer.prev_token.token != TokenType::RBrace {
            self.compile_precedence(Precedence::EndLine);
            if self.lexer.prev_token.token == TokenType::Eof {
                break;
            }
        }
        self.vm.emit_instruction(OpCode::EndScope, self.lexer.prev_token.line);
    }

    fn string(&mut self) {
        let mut s = String::new();
        while self.lexer.cur_token.token != TokenType::DQuote {
            s.push_str(self.lexer.cur_token.value.to_string().as_str());
            self.lexer.next_token();
            if self.lexer.cur_token.token == TokenType::Eof {
                return;
            }
        }
        self.lexer.next_token();
        self.vm.emit_constant(TokenValue::String(s), self.lexer.prev_token.line);
    }

    fn grouping(&mut self) {
        self.compile_precedence(Precedence::None);
    }

    fn unary(&mut self) {
        let op_tok = self.lexer.prev_token.clone();
        let rule = self.parse_rules(op_tok.token);
        if let Some(val) = FromPrimitive::from_usize(rule.prec as usize + 1) {
            self.compile_precedence(val);
        }
        match op_tok.token {
            TokenType::Plus => { self.vm.emit_instruction(OpCode::UnaryPos, op_tok.line); }
            TokenType::Minus => { self.vm.emit_instruction(OpCode::UnaryNeg, op_tok.line); }
            TokenType::NotUnary => { self.vm.emit_instruction(OpCode::UnaryNot, op_tok.line); }
            _ => { return; }
        }
    }

    fn matrix(&mut self) {
        let mut cols = 0;
        let mut rows = 1;

        let mut tmp = 0;
        loop {
            self.compile_precedence(Precedence::Matrix);
            if self.lexer.cur_token.token == TokenType::Comma {
                tmp += 1;
                self.lexer.next_token();
            } else if self.lexer.cur_token.token == TokenType::Semicolon {
                if cols == 0 {
                    cols = tmp + 1;
                }
                self.lexer.next_token();
                rows += 1;
            } else {
                if cols == 0 {
                    cols = tmp + 1;
                }
                break;
            }
        }
        self.consume(TokenType::RBracket);
        self.vm.emit_matrix(rows, cols, self.lexer.prev_token.line);
    }

    fn remove_last_load(&mut self) {
        let last = self.vm.instructions.last().unwrap().clone();
        if last == OpCode::Load as usize {
            self.vm.instructions.pop();
            self.vm.lines.pop();
        }
    }

    fn tuple(&mut self) {
        let mut count: usize = 1;
        loop {
            count += 1;

            self.compile_precedence(FromPrimitive::from_usize(Precedence::Tuple as usize + 1).unwrap());
            if self.lexer.cur_token.token == TokenType::Comma {
                self.lexer.next_token();
            } else {
                break;
            }
        }
        // if next token is assignment, remove loads
        if self.lexer.peek_assignment() {
            let mut ids = Vec::new();
            self.lexer.next_token();
            for i in 0..count {
                self.remove_last_load();
                let name_ptr = self.vm.instructions.pop().unwrap();
                if let TokenValue::String(s) = self.vm.consts[name_ptr].clone() {
                    ids.push(s.clone());
                    self.vm.instructions.pop();
                    self.vm.instructions.pop();
                    self.vm.instructions.pop();
                    self.vm.lines.pop();
                    self.vm.lines.pop();
                    self.vm.lines.pop();
                    self.vm.remove_offset(s);
                }
            }

            self.vm.modify_offset(-(count as isize));

            for i in 0..count {
                self.vm.emit_symbol(ids[count - i - 1].clone(), self.lexer.prev_token.line);
                self.compile_precedence(FromPrimitive::from_usize(Precedence::Tuple as usize + 1).unwrap());
                if self.lexer.cur_token.token == TokenType::Comma {
                    self.lexer.next_token();
                }

                self.vm.emit_instruction(OpCode::Assign, self.lexer.prev_token.line);
            }
        } else {
            self.vm.emit_tuple(count as usize, self.lexer.prev_token.line);
        }
    }

    fn binary(&mut self) {
        let op_tok = self.lexer.prev_token.clone();
        let rule = self.parse_rules(op_tok.token);
        if self.lexer.cur_token.token == TokenType::Eof {
            return;
        }
        if let Some(val) = FromPrimitive::from_usize(rule.prec as usize + 1) {
            self.compile_precedence(val);
        }

        match op_tok.token {
            TokenType::Plus => { self.vm.emit_instruction(OpCode::Add, op_tok.line); }
            TokenType::Minus => { self.vm.emit_instruction(OpCode::Sub, op_tok.line); }
            TokenType::Mul => { self.vm.emit_instruction(OpCode::Mul, op_tok.line); }
            TokenType::Div => { self.vm.emit_instruction(OpCode::Div, op_tok.line); }
            TokenType::Assign => { self.vm.emit_instruction(OpCode::Assign, op_tok.line); }
            TokenType::Pow => { self.vm.emit_instruction(OpCode::Pow, op_tok.line); }
            TokenType::LArrow => { self.vm.emit_instruction(OpCode::LessThan, op_tok.line); }
            TokenType::RArrow => { self.vm.emit_instruction(OpCode::MoreThan, op_tok.line); }
            TokenType::LessEq => { self.vm.emit_instruction(OpCode::LessEqThan, op_tok.line); }
            TokenType::MoreEq => { self.vm.emit_instruction(OpCode::MoreEqThan, op_tok.line); }
            TokenType::Eq => { self.vm.emit_instruction(OpCode::Eq, op_tok.line); }
            TokenType::NotEq => { self.vm.emit_instruction(OpCode::NotEq, op_tok.line); }
            TokenType::AndBool => { self.vm.emit_instruction(OpCode::And, op_tok.line); }
            TokenType::OrBool => { self.vm.emit_instruction(OpCode::Or, op_tok.line); }
            _ => { return; }
        }
    }

    fn identifier(&mut self) {
        let cur = self.lexer.prev_token.clone();
        if let TokenValue::String(id) = cur.value {
            self.vm.emit_symbol(id, self.lexer.prev_token.line);
            if !self.lexer.peek_assignment() {
                self.vm.emit_instruction(OpCode::Load, self.lexer.prev_token.line);
            }
        }
    }

    fn number(&mut self) {
        let val = &self.lexer.prev_token;
        self.vm.emit_constant(val.value.clone(), val.line);
    }

    fn compile_precedence(&mut self, prec: Precedence) {
        self.lexer.next_token();

        let prefix_rule = self.parse_rules(self.lexer.prev_token.token).prefix;
        match prefix_rule {
            ParseRuleFn::Func(func) => { func(self); }
            ParseRuleFn::Null => { //add error
                return;
            }
        }
        let x = prec as u32;
        let y = self.parse_rules(self.lexer.cur_token.token).prec as u32;
        while prec as u32 <= self.parse_rules(self.lexer.cur_token.token).prec as u32 {
            self.lexer.next_token();
            let infix_rule = self.parse_rules(self.lexer.prev_token.token).infix;
            match infix_rule {
                ParseRuleFn::Func(func) => { func(self); }
                ParseRuleFn::Null => {
                    // add error
                    return;
                }
            }
        }
    }

    pub fn compile(&mut self) {
        self.lexer.next_token();
        loop {
            let len = self.vm.instructions.len();
            self.compile_precedence(Precedence::None);
            if self.lexer.cur_token.token == TokenType::Eof {
                break;
            }
            if len == self.vm.instructions.len() {
                continue;
            }
            self.vm.emit_instruction(OpCode::Print, self.lexer.cur_token.line - 1);
            self.last_pointer = self.vm.instructions.len();
            self.lexer.next_token();
        }
        if self.vm.instructions.last().unwrap().clone() != OpCode::Print as usize {
            self.vm.emit_instruction(OpCode::Print, self.lexer.prev_token.line);
        }
        self.vm.emit_instruction(OpCode::EndProgram, self.lexer.prev_token.line);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bigdecimal::BigDecimal;
    use crate::vm::{SymbolValue, InterpretResult};
    use crate::interpreter::Interpreter;

    fn run(source: &str) -> Vec<(usize, String)> {
        let mut c = Compiler::new(source);
        c.compile();
        let dis = c.vm.disassemble(false);
        for item in dis {
            print!("{}", item);
        }
        c.vm.reset();

        let mut interpreter = Interpreter::new();
        let result = interpreter.interpret(c.vm);

        println!("Output:\n");
        let lines: Vec<&str> = source.split("\n").collect();
        for i in 0..interpreter.output.len() {
            let el = interpreter.output[i].clone();
            let line = if el.0 < lines.len() {lines[el.0]} else {""};
            println!("{}: {}\t {}", i + 1, line, interpreter.output[i].1);
        }
        match result {
            InterpretResult::Ok => {}
            InterpretResult::CompileError(err) => {
                println!("{}", err);
            }
            InterpretResult::RuntimeError(err) => {
                println!("{}", err);
            }
        }

        return interpreter.output;
    }

    #[test]
    fn test_arithmetic() {
        let out = run("3 + 20 * 3 / 4");
    }

    #[test]
    fn test_assignment() {
        let out = run("x = 3\nx+3\ny=4\ny = x+y");
    }

    #[test]
    fn test_tuple() {
        let out = run("1, 2, 3");
    }

    #[test]
    fn test_tuple_assign() {
        let out = run("x, y, z = (1, 2, 3)\nx");
    }

    #[test]
    fn test_grouping() {
        let out = run("(1 + 2) * -3");
    }

    #[test]
    fn test_matrix() {
        let out = run("x = [1, 2, 3]");
    }

    #[test]
    fn test_matrix_2() {
        let out = run("x = [1, 2, 3]\nx");
    }

    #[test]
    fn test_matrix_3() {
        let out = run("x = [1 + -3, 2, y]");
    }

    #[test]
    fn test_errors() {
        let out = run("x = 3\ny=x\ny");
    }

    #[test]
    fn test_string() {
        let out = run("x, y = ([1, 2, 3], 5), (3)\nx");
    }

    #[test]
    fn test_fn() {
        let out = run("f(x, y) = {\n a = x * x + 2 * x + y\ng(z) = z * z\ng}\nx = 3\na = f(x, 5)\na(2)");
    }

    #[test]
    fn test_file() {
        use std::fs;

        let input = fs::read_to_string("file.in").unwrap();
        run(input.as_str());
    }
}