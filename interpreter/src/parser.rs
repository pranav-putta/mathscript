use crate::lexer::{TokenType, TokenValue, Lexer, Token};
use crate::errors::Error;
use crate::ast::{Expr, Block, Empty, Assignment, Variable, Binary, Ternary, Unary, Value, FnCall, FnDecl, Sequence, MatrixExpr};
use crate::lexer::TokenType::{Eof, EndL, Id, Reserved, Assign, Comma, Plus, Colon, Minus, NotUnary, Num, LParen, RParen, Def, LBrace, RBrace, LBracket, RBracket, Semicolon, ReservedValue};
use crate::data::Data;

const OP_LEVELS: i8 = 8;

pub struct Parser {
    lexer: Lexer,
    current: Token,
}

impl Parser {
    pub fn new(text: &str) -> Parser {
        let mut lexer = Lexer::new(text);
        let current = lexer.next_token().unwrap();
        return Parser { lexer, current };
    }

    pub fn parse(&mut self) -> Result<Expr, Error> {
        let node = self.program();
        if self.current.token != TokenType::Eof {
            return Err(Error::WrongType("expected eof".to_string()));
        }
        return node;
    }

    fn program(&mut self) -> Result<Expr, Error> {
        let node = self.block();
        self.eat(Eof);
        return node;
    }

    fn block(&mut self) -> Result<Expr, Error> {
        let mut output = Vec::new();
        loop {
            self.eat_new_lines();
            let statement = self.statement().unwrap();
            output.push(statement);

            if self.current.token != EndL {
                // statement is broken
                break;
            }
        }
        return Ok(Expr::Block(Box::new(Block { children: output })));
    }

    fn statement(&mut self) -> Result<Expr, Error> {
        return if self.current.token == Id {
            self.identifier()
        } else if self.current.token == Reserved {
            self.reserved()
        } else if self.current.token != Eof {
            self.expr(true)
        } else {
            Ok(Expr::Empty(Empty {}))
        };
    }

    fn identifier(&mut self) -> Result<Expr, Error> {
        return if self.current.token == Id {
            if self.lexer.peek_token().unwrap().token == Assign {
                self.assignments()
            } else {
                self.expr(true)
            }
        } else {
            Err(Error::IdentifierNotFound(String::from("incorrect identifier")))
        };
    }

    fn reserved(&mut self) -> Result<Expr, Error> {
        let val = &self.current.value;

        if let TokenValue::String(val) = val {
            return if val == "true" {
                self.expr(true)
            } else if val == "false" {
                self.expr(true)
            } else {
                Err(Error::WrongType(String::from("Expected a boolean")))
            };
        }

        return Err(Error::WrongType(String::from("Expected a boolean")));
    }

    fn rec_binary(&mut self, level: i8, ignore: bool) -> Result<Expr, Error> {
        if level < 0 {
            return Ok(self.factor(ignore).unwrap());
        }

        let mut node = self.rec_binary(level - 1, ignore).unwrap();
        let ignore = ignore || Parser::order_of_operation(Plus) == level;

        let mut order = Parser::order_of_operation(self.current.token);
        while order == level {
            if ignore || self.lexer.peek(0).unwrap() == ' ' || self.lexer.peek(-2).unwrap() != ' ' {
                let op = self.current.token.clone();
                self.eat(op);
                let right = self.rec_binary(level - 1, ignore).unwrap();
                node = Expr::Binary(Box::new(Binary { left: node.clone(), op, right }))
            } else {
                return Ok(node);
            }
            order = Parser::order_of_operation(self.current.token);
        }

        return Ok(node);
    }

    fn expr(&mut self, ignore_white_space: bool) -> Result<Expr, Error> {
        let expr = self.rec_binary(OP_LEVELS, ignore_white_space).unwrap();

        if self.current.token == TokenType::Ternary {
            self.eat(TokenType::Ternary);
            let t = self.expr(ignore_white_space).unwrap();
            self.eat(Colon);
            let f = self.expr(ignore_white_space).unwrap();
            return Ok(Expr::Ternary(Box::new(Ternary { condition: expr, t_expr: t, f_expr: f })));
        }

        return Ok(expr);
    }

    fn assignments(&mut self) -> Result<Expr, Error> {
        let mut assignments = Vec::new();
        loop {
            let assignment = self.assignment().unwrap();
            assignments.push(assignment);

            if self.lexer.peek_token().unwrap().token == Comma {
                self.eat(Comma);
            } else {
                break;
            }
        }

        return Ok(Expr::Block(Box::new(Block { children: assignments })));
    }

    fn assignment(&mut self) -> Result<Expr, Error> {
        let left = self.variable().unwrap();

        self.eat(Assign);
        let right = self.expr(true).unwrap();

        return Ok(Expr::Assign(Box::new(Assignment { id: left, expr: right })));
    }

    fn variable(&mut self) -> Result<Expr, Error> {
        return if let TokenValue::String(id) = &self.current.value {
            let node = Expr::Var(Variable { id: id.clone() });
            self.eat(Id);
            Ok(node)
        } else {
            Err(Error::IdentifierNotFound(String::from("incorrect identifier")))
        };
    }

    fn factor(&mut self, ignore: bool) -> Result<Expr, Error> {
        let token = self.current.clone();
        return match token.token {
            TokenType::Plus => {
                self.eat(Plus);
                Ok(Expr::Unary(Box::new(Unary { op: token.token.clone(), expr: self.factor(ignore).unwrap() })))
            }
            TokenType::Minus => {
                self.eat(Minus);
                Ok(Expr::Unary(Box::new(Unary { op: token.token.clone(), expr: self.factor(ignore).unwrap() })))
            }
            TokenType::NotUnary => {
                self.eat(NotUnary);
                Ok(Expr::Unary(Box::new(Unary { op: token.token.clone(), expr: self.factor(ignore).unwrap() })))
            }
            TokenType::Num => {
                self.eat(Num);
                let result = &token.value;
                let mut data = Data::num(-1f64);
                match result {
                    TokenValue::Number(n) => {
                        data = Data::num(*n);
                    }
                    TokenValue::String(str) => {
                        data = Data::str(str.clone());
                    }
                }
                Ok(Expr::Val(Value { val: data }))
            }
            TokenType::LParen => {
                self.eat(LParen);
                let node = self.expr(ignore);
                self.eat(RParen);
                node
            }
            TokenType::LBracket => {
                Ok(Expr::Matrix(Box::new(self.matrix().unwrap())))
            }
            TokenType::ReservedValue => {
                Ok(self.reserved_value().unwrap())
            }
            TokenType::Id => {
                let next = self.lexer.peek_token().unwrap();
                if next.token == LParen {
                    let node = self.function_call().unwrap();
                    if self.current.token == Assign || self.current.token == Def {
                        return if let Expr::FnCall(node) = node {
                            self.function_definition(*node)
                        } else {
                            Err(Error::NotImplemented)
                        };
                    }
                    Ok(node)
                } else {
                    self.variable()
                }
            }
            _ => {
                Ok(Expr::Empty(Empty {}))
            }
        };
    }

    fn function_definition(&mut self, fn_call: FnCall) -> Result<Expr, Error> {
        self.eat(self.current.token);

        let mut args = Vec::new();
        for arg in &fn_call.args.seq {
            args.push(arg.clone());
        }

        if self.current.token == LBrace {
            // multi line statements
            self.eat(LBrace);
            let exprs = self.block().unwrap();
            self.eat(RBrace);
            return if let Expr::Block(block) = exprs {
                Ok(Expr::FnDecl(Box::new(FnDecl { id: fn_call.id.clone(), args: Sequence { seq: args }, func: *block })))
            } else {
                Err(Error::WrongType(String::from("Couldn't parse")))
            };
        } else {
            let expr = self.expr(true).unwrap();
            return Ok(Expr::FnDecl(Box::new(FnDecl { id: fn_call.id.clone(), args: Sequence { seq: args }, func: Block { children: vec![expr] } })));
        }

        return Err(Error::WrongType(String::from("Expected {")));
    }

    fn function_call(&mut self) -> Result<Expr, Error> {
        let name = self.current.value.clone();

        if let TokenValue::String(str) = name {
            self.eat(Id);
            self.eat(LParen);

            let mut args = Vec::new();
            while self.current.token != RParen {
                args.push(self.expr(true).unwrap());

                if self.current.token == Comma {
                    self.eat(Comma);
                } else {
                    break;
                }
            }
            self.eat(RParen);
            return Ok(Expr::FnCall(Box::new(FnCall { id: str.clone(), args: Sequence { seq: args } })));
        }

        return Err(Error::WrongType(String::from("Expected string identfiier")));
    }

    fn matrix(&mut self) -> Result<MatrixExpr, Error> {
        let mut arr = Vec::new();
        self.eat(LBracket);
        while self.current.token != RBracket {
            arr.push(self.matrix_row(TokenType::RBracket).unwrap());
            if self.current.token == Semicolon {
                self.eat(Semicolon);
            }
        }

        self.eat(RBracket);
        return Ok(MatrixExpr { matrix: arr });
    }

    fn matrix_row(&mut self, end: TokenType) -> Result<Vec<Expr>, Error> {
        let mut arr = Vec::new();

        loop {
            let expr = self.expr(false).unwrap();
            arr.push(expr);

            if self.current.token != Semicolon && self.current.token != end
            {
                if self.current.token == Comma {
                    self.eat(Comma);
                }
            } else {
                break;
            }
        }

        return Ok(arr);
    }

    fn reserved_value(&mut self) -> Result<Expr, Error> {
        let val = &self.current.value;

        if let TokenValue::String(val) = val {
            if val == "true" {
                self.eat(ReservedValue);
                return Ok(Expr::Val(Value { val: Data::bool(true) }));
            } else if val == "false" {
                self.eat(ReservedValue);
                return Ok(Expr::Val(Value { val: Data::bool(false) }));
            } else {
                return Err(Error::WrongType(String::from("Expected a boolean")));
            }
        }

        return Err(Error::WrongType(String::from("Expected a boolean")));
    }
    fn eat_new_lines(&mut self) {
        while self.current.token == EndL {
            self.eat(EndL);
        }
    }

    fn eat(&mut self, tok: TokenType) -> Option<Error> {
        // verify that token matches
        return if self.current.token == tok {
            self.current = self.lexer.next_token().unwrap();
            None
        } else {
            Some(Error::WrongType(String::from("Expected todo")))
        };
    }

    fn order_of_operation(token: TokenType) -> i8 {
        return match token {
            TokenType::Pow => { 0 }
            TokenType::Mod => { 1 }
            TokenType::Mul => { 2 }
            TokenType::Div => { 2 }
            TokenType::Plus => { 3 }
            TokenType::Minus => { 3 }
            TokenType::AndBit => { 4 }
            TokenType::OrBit => { 4 }
            TokenType::LessEq => { 5 }
            TokenType::MoreEq => { 5 }
            TokenType::RArrow => { 5 }
            TokenType::LArrow => { 5 }
            TokenType::Eq => { 5 }
            TokenType::NotEq => { 5 }
            TokenType::AndBool => { 6 }
            TokenType::OrBool => { 7 }
            _ => { i8::MIN }
        };
    }
}

#[cfg(test)]
mod tests {
    use crate::parser::Parser;
    use crate::ast::{compute, Evaluates};
    use crate::symtable::SymTable;
    use crate::interpreter::interpret;


    fn ast(text: &str) {
        let mut parser = Parser::new(text);
        let expr = parser.parse().unwrap();
        println!("{:#?}", expr);
    }

    #[test]
    fn test_addition() {
        let result = interpret("1.2 + (1 - 10 / 2) * 6");
        println!("{:#?}", result);
    }

    #[test]
    fn test_inequality() {
        let result = interpret("1 + 3 > 4");
        println!("{:#?}", result);
    }

    #[test]
    fn test_unary() {
        let result = interpret("-(3+9)");
        println!("{:#?}", result);
    }

    #[test]
    fn test_ternary() {
        let result = interpret("x = 3\ny = x + 2\ny = y - 2\nb = x == y ? 2 : 3\nb + 4");
        println!("{:#?}", result);
    }

    #[test]
    fn test_matrix() {
        let result = interpret("[1 2 3 ] * [1; 2; 3] / 10");
        println!("{:#?}", result);
    }

    #[test]
    fn test_fn_decl() {
        let result = interpret("f(x, y, z) => x ^ y + z\nf(3, 6.5, 0)");
        println!("{:#?}", result);
    }

    #[test]
    fn test_recursion() {
        let result = interpret("fact(n) => {\nn == 0 ? 1 : n * fact(n - 1)\n}\nx = fact(5)\nx+90");
        println!("{:#?}", result);
    }

    #[test]
    fn test_err() {
        let result = interpret("x = 3\ny + 2");
        println!("{:#?}", result);
    }
}