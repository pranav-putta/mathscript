use crate::lexer::{Lexer, Token, TokenValue, TokenType};
use crate::grammar::{Grammar, GrammarParser, GrammarNodeType, GrammarNode};
use std::collections::BinaryHeap;
use crate::pq::PriorityQueue;
use std::env::var;
use crate::ast::{Expr, Value, Block, Identifier, Empty, Assignment, FnDecl, If, While, Variable, Literal, MatrixExpr, FnCall, Ternary};
use crate::errors::Error;
use crate::data::{Data, Primitive};
/*

struct GParser {
    lexer: Lexer,
    token: Token,
    grammar: Grammar,
}

/// public parser implementation
impl GParser {
    /// creates a new parser
    pub fn new(text: &str) -> GParser {
        let mut lexer = Lexer::new(text);
        let token = lexer.next_token().unwrap_or(Token::eof());
        let grammar = GrammarParser::new(text);

        GParser { lexer, token, grammar }
    }

    pub fn parse(&mut self) {
        self.eval(self.grammar["block"].clone());
    }

    fn eat(&mut self, tok: TokenType) -> Option<TokenValue> {
        let next = self.lexer.next_token().unwrap();
        if next.token == tok {
            return Some(next.value);
        }
        return None;
    }

    fn eval(&mut self, node: GrammarNode) -> Result<Option<Expr>, Error> {
        match node.prop {
            GrammarNodeType::String => {
                // return value node with string data
                let tok = self.eat(TokenType::Id).unwrap();
                return if let TokenValue::String(val) = tok {
                    Ok(Some(Value::from_str(val)))
                } else {
                    Err(Error::WrongType(String::from("expected string")))
                };
            }
            GrammarNodeType::Num => {
                // return value node with number data
                let tok = self.eat(TokenType::Id).unwrap();
                return if let TokenValue::Number(val) = tok {
                    Ok(Some(Value::from_num(val)))
                } else {
                    Err(Error::WrongType(String::from("expected number")))
                };
            }
            GrammarNodeType::Bool => {
                // return value node with boolean data
                let tok = self.eat(TokenType::Id).unwrap();
                return if let TokenValue::String(val) = tok {
                    if val == "true" {
                        Ok(Some(Value::from_bool(true)))
                    } else if val == "false" {
                        Ok(Some(Value::from_bool(false)))
                    } else {
                        Err(Error::WrongType(String::from("expected boolean")))
                    }
                } else {
                    Err(Error::WrongType(String::from("expected string")))
                };
            }
            GrammarNodeType::Literal => {
                return if let Some(TokenValue::String(id)) = &node.value {
                    if self.scan_literal(id) {
                        Ok(None)
                    } else {
                        Err(Error::WrongType(String::from("Expected a literal")))
                    }
                } else {
                    Err(Error::WrongType(String::from("Expected a string")))
                };
            }
            GrammarNodeType::Until => {
                // skip text until new line
                if let Some(TokenValue::String(id)) = &node.value {
                    let result = self.skip_until(id.as_str());
                    return if result {
                        Ok(None)
                    } else {
                        Err(Error::InternalError)
                    };
                }
                return Err(Error::InternalError);
            }
            GrammarNodeType::Id => {
                if let Some(TokenValue::String(id)) = &node.value {
                    let result = self.eval(self.grammar[id].clone());
                    if let Ok(Some(result)) = result {}
                }
            }
            GrammarNodeType::Expr => {
                // go through each child of expression
                let children = &node.children;
                let mut results = Vec::new();
                for child in children {
                    // evaluate this child
                    let output = self.eval(child.clone());
                    match output {
                        Ok(ok) => {
                            if let Some(o) = ok {
                                results.push(o);
                            }
                        }
                        Err(err) => {
                            return Err(err);
                        }
                    }
                }
                return Ok(None); // with this vec<expr>
            }
            GrammarNodeType::Loop => {}
            GrammarNodeType::Order => {}
            GrammarNodeType::Variation => {
                /*
                let mut pq: PriorityQueue<GrammarNode> = PriorityQueue::new(|a, b| b.children.len() as i32 - a.children.len() as i32);
                for v in &node.children {
                    pq.push(v.clone());
                }

                while !pq.empty() {
                    // pop next variation and process
                    let variation = pq.pop().unwrap();
                    let b = self.eval(variation);
                    if b {}
                }*/
            }
        }
        Ok(None)
    }

    fn match_pattern(&mut self) -> bool {
        false
    }

    fn construct_expr(&mut self, id: &str, arr: Vec<Expr>) -> Result<Expr, Error> {
        return match id {
            "block" => {
                Ok(Expr::Block(Box::new(Block { children: arr })))
            }
            "id" => {
                if arr.len() > 0 {
                    return if let Expr::Val(val) = &arr[0] {
                        if let Data::Primitive(Primitive::Str(str)) = &val.val {
                            Ok(Expr::Id(Identifier { id: str.clone() }))
                        } else {
                            Err(Error::WrongType(String::from("expected a string")))
                        }
                    } else {
                        Err(Error::WrongType(String::from("expected a string")))
                    };
                } else {
                    Err(Error::WrongNumArguments)
                }
            }
            "comment" => {
                return Ok(Expr::Empty(Empty {}));
            }
            "assign" => {
                if arr.len() != 2 {
                    return Err(Error::WrongNumArguments);
                }

                let id = &arr[0];
                let lit = &arr[1];
                return if let (Expr::Id(expr_id), Expr::Literal(expr_literal)) = (id, lit) {
                    Ok(Expr::Assign(Box::new(Assignment { id: expr_id.id.clone(), expr: lit.clone() })))
                } else {
                    Err(Error::WrongType(String::from("expcted identifier and literal")))
                };
            }
            "fn_decl" => {
                if arr.len() != 3 {
                    return Err(Error::WrongNumArguments);
                }

                let id = &arr[0];
                let seq = &arr[1];
                let block = &arr[2];
                if let (Expr::Id(id), Expr::Seq(seq), Expr::Block(block)) = (id, seq, block) {
                    return Ok(Expr::FnDecl(Box::new(FnDecl { id: id.id.clone(), args: *seq.clone(), func: *block.clone() })));
                }
                Err(Error::WrongType(String::from("expected id, seq, block")))
            }
            "if" => {
                if arr.len() != 2 {
                    return Err(Error::WrongNumArguments);
                }

                let expr = &arr[0];
                let block = &arr[1];
                return if let (Expr::Block(block)) = block {
                    Ok(Expr::If(Box::new(If { block: *block.clone(), bool_expr: expr.clone() })))
                } else {
                    Err(Error::WrongType(String::from("expected a block")))
                };
            }
            "while" => {
                if arr.len() != 2 {
                    return Err(Error::WrongNumArguments);
                }

                let expr = &arr[0];
                let block = &arr[1];
                return if let (Expr::Block(block)) = block {
                    Ok(Expr::While(Box::new(While { block: *block.clone(), expr: expr.clone() })))
                } else {
                    Err(Error::WrongType(String::from("expected a block")))
                };
            }
            "var" => {
                if arr.len() != 1 {
                    return Err(Error::WrongNumArguments);
                }

                let data = &arr[0];
                return if let Expr::Val(val) = data {
                    if let Data::Primitive(Primitive::Str(str)) = &val.val {
                        Ok(Expr::Var(Variable { id: str.clone() }))
                    } else {
                        Err(Error::WrongType(String::from("expected string")))
                    }
                } else {
                    Err(Error::WrongType(String::from("expected string")))
                };
            }
            "literal" => {
                if arr.len() != 1 {
                    return Err(Error::WrongNumArguments);
                }

                let data = &arr[0];
                return if let Expr::Val(data) = data {
                    Ok(Expr::Literal(Literal { val: data.val.clone() }))
                } else if let Expr::Matrix(m) = data {
                    Ok(Expr::Matrix(Box::new(*m.clone())))
                } else {
                    Err(Error::WrongType(String::from("expected a value")))
                };
            }
            "statement" => {
                if arr.len() != 1 {
                    return Err(Error::WrongNumArguments);
                }

                let expr = &arr[0];
                return match expr {
                    Expr::Id(id) => {
                        Ok(Expr::Id(id.clone()))
                    }
                    Expr::Empty(_) => {
                        Ok(Expr::Empty(Empty {}))
                    }
                    Expr::Assign(a) => {
                        Ok(Expr::Assign(a.clone()))
                    }
                    Expr::Block(block) => {
                        Ok(Expr::Block(block.clone()))
                    }
                    Expr::FnDecl(fnd) => {
                        Ok(Expr::FnDecl(fnd.clone()))
                    }
                    Expr::If(i) => {
                        Ok(Expr::If(i.clone()))
                    }
                    Expr::While(w) => {
                        Ok(Expr::While(w.clone()))
                    }
                    _ => {
                        Err(Error::WrongType(String::from("expected a statement variation")))
                    }
                };
            }
            "matrix" => {
                if arr.len() != 1 {
                    return Err(Error::WrongNumArguments);
                }

                let data = &arr[0];

                if let Expr::Seq(seq) = data {
                    let m = (*seq).seq.clone();
                    let mut matrix = Vec::new();
                    for row in m {
                        if let Expr::Seq(row) = row {
                            matrix.push(row.seq);
                        } else {
                            return Err(Error::WrongType(String::from("expected a sequence")));
                        }
                    }
                    Ok(Expr::Matrix(Box::new(MatrixExpr { matrix })))
                } else {
                    return Err(Error::WrongType(String::from("expected a sequence")));
                }
            }
            "fn_call" => {
                if arr.len() != 2 {
                    return Err(Error::WrongNumArguments);
                }

                let id = &arr[0];
                let seq = &arr[1];

                return if let (Expr::Id(id), Expr::Seq(seq)) = (id, seq) {
                    let vars = *seq.clone();
                    Ok(Expr::FnCall(Box::new(FnCall { id: id.id.clone(), args: vars })))
                } else {
                    Err(Error::WrongType(String::from("expected an id (seq)")))
                };
            }
            "ternary" => {
                if arr.len() != 3 {
                    return Err(Error::WrongNumArguments);
                }

                let b = arr[0].clone();
                let t = arr[1].clone();
                let f = arr[2].clone();

                return Ok(Expr::Ternary(Box::new(Ternary { condition: b, t_expr: t, f_expr: f })));
            }
            "term" => {
                if arr.len() != 1 {
                    return Err(Error::WrongNumArguments);
                }

                let data = &arr[0];
                return match data {
                    Expr::Var(v) => {
                        Ok(Expr::Var(v.clone()))
                    }
                    Expr::Literal(l) => {
                        Ok(Expr::Literal(l.clone()))
                    }
                    Expr::FnCall(f) => {
                        Ok(Expr::FnCall(f.clone()))
                    }
                    Expr::Ternary(t) => {
                        Ok(Expr::Ternary(t.clone()))
                    }
                    _ => { Err(Error::WrongType(String::from("expected a literal, var, fn call, or ternary"))) }
                };
            }
            "unary" => {
                
            }
            _ => {
                Err(Error::WrongType(String::from("expected a string")))
            }
        };
        return Err(Error::WrongType(String::from("expected a string")));
    }

    /// skip tokens until token is matched
    fn skip_until(&mut self, literal: &str) -> bool {
        let mut next = self.lexer.peek_token().unwrap();
        loop {
            // check if literal has been reached
            if let TokenValue::String(str) = &next.value {
                if str.as_str() == literal {
                    self.lexer.next_token();
                    return true;
                }
            }

            // keep skipping
            self.lexer.next_token();
            let tmp = self.lexer.peek_token();
            if let Ok(t) = tmp {
                next = t;
            } else {
                return false;
            }
        }
    }

    fn scan_literal(&mut self, literal: &str) -> bool {
        let mut cur = String::new();
        let tmp_pos = self.lexer.position;
        let tmp_char = self.lexer.current;

        loop {
            if cur.len() > literal.len() {
                break;
            }
            if let Ok(token) = self.lexer.next_token() {
                if let TokenValue::String(value) = token.value {
                    cur.push_str(value.as_str());
                    if cur == literal {
                        return true;
                    }
                } else {
                    break;
                }
            } else {
                break;
            };
        }

        self.lexer.position = tmp_pos;
        self.lexer.current = tmp_char;
        return false;
    }
}*/