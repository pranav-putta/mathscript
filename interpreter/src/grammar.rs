use std::fs;
use std::collections::HashMap;
use crate::lexer::{Lexer, TokenType, TokenValue};
use crate::lexer::TokenType::{SQuote, Id, At};

pub type Grammar = HashMap<String, GrammarNode>;

#[derive(Debug, Clone)]
pub enum GrammarNodeType {
    String,
    Until,
    Num,
    Bool,
    Loop,
    Literal,
    Expr,
    Order,
    Id,
    Variation,
}

#[derive(Debug, Clone)]
pub struct GrammarNode {
    pub prop: GrammarNodeType,
    pub value: Option<TokenValue>,
    pub children: Vec<GrammarNode>,

}

impl GrammarNode {
    fn new(t: GrammarNodeType) -> GrammarNode {
        GrammarNode { children: Vec::new(), prop: t, value: None }
    }

    fn with_val(t: GrammarNodeType, val: TokenValue) -> GrammarNode {
        GrammarNode { children: Vec::new(), prop: t, value: Some(val) }
    }
}

pub struct GrammarParser {
    lexer: Lexer,
    map: Grammar,
}

impl GrammarParser {
    pub fn new(path: &str) -> Grammar {
        let file = fs::read_to_string(path).unwrap();
        let lexer = Lexer::new(file.as_str());
        let mut parser = GrammarParser { lexer, map: HashMap::new() };
        parser.parse();
        return parser.map.clone();
    }

    fn parse(&mut self) {
        // check for comments
        let mut cont = true;
        while cont {
            match self.lexer.peek_token().unwrap().token {
                TokenType::Eof => {
                    cont = false;
                }
                _ => {
                    self.parse_statement()
                }
            }
        }
    }

    fn eat(&mut self, tok: TokenType) -> Option<TokenValue> {
        let next = self.lexer.next_token().unwrap();
        if next.token == tok {
            return Some(next.value);
        }
        return None;
    }

    fn eat_any(&mut self) -> Option<TokenValue> {
        let next = self.lexer.next_token().unwrap();
        return Some(next.value);
    }

    fn eat_new_lines(&mut self) {
        let mut next = self.lexer.peek_token().unwrap();
        while next.token == TokenType::EndL {
            self.lexer.next_token();
            next = self.lexer.peek_token().unwrap();
        }
    }

    fn compress_children_if_possible(children: Vec<GrammarNode>, n_type: GrammarNodeType) -> GrammarNode {
        return if children.len() == 1 {
            let out = children[0].clone();
            drop(children);
            out
        } else {
            GrammarNode { children, value: None, prop: n_type }
        };
    }

    fn parse_statement(&mut self) {
        let mut next = self.lexer.peek_token().unwrap();

        if next.token == TokenType::HashTag {
            // skip comment
            while next.token != TokenType::EndL {
                self.lexer.next_token();
                next = self.lexer.peek_token().unwrap();
            }
            self.eat_new_lines();
            return;
        }
        // pattern: id: ...
        let tok = self.eat(TokenType::Id).unwrap();

        // check if type is operation
        if tok == TokenValue::String("op".to_string()) {

        }
        self.eat(TokenType::Colon);
        let expr = self.parse_ordered();
        self.eat_new_lines();

        if let TokenValue::String(id) = tok {
            self.map.insert(id, expr);
        }
    }


    fn parse_ordered(&mut self) -> GrammarNode {
        let mut children = Vec::new();
        loop {
            let expr = self.parse_variants();
            println!("Variant: {:?}", expr);
            children.push(expr);

            let next = self.lexer.peek_token().unwrap();
            if next.token == TokenType::RArrow {
                self.eat(TokenType::RArrow);
            } else {
                break;
            }
        }

        return GrammarParser::compress_children_if_possible(children, GrammarNodeType::Order);
    }

    fn parse_variants(&mut self) -> GrammarNode {
        let mut children = Vec::new();
        loop {
            let variant = self.parse_expr();
            children.push(variant);

            let next = self.lexer.peek_token().unwrap();
            if next.token == TokenType::OrBit {
                self.eat(TokenType::OrBit);
            } else {
                break;
            }
        }

        return GrammarParser::compress_children_if_possible(children, GrammarNodeType::Variation);
    }


    fn parse_expr(&mut self) -> GrammarNode {
        let mut next = self.lexer.peek_token().unwrap();
        let mut children = Vec::new();
        while next.token != TokenType::OrBit && next.token != TokenType::EndL {
            let mut new_node: Option<GrammarNode> = None;

            if next.token == TokenType::LParen {
                // wrapped statement
                self.eat(TokenType::LParen);
                let mut inner = self.parse_ordered();
                self.eat(TokenType::RParen);

                // check if loop variant
                next = self.lexer.peek_token().unwrap();
                if next.token == TokenType::Mul {
                    self.eat(TokenType::Mul);
                    inner.prop = GrammarNodeType::Loop;
                }
                new_node = Some(inner);
            } else if next.token == TokenType::SQuote {
                new_node = Some(GrammarNode::with_val(GrammarNodeType::Literal, self.parse_literal()));
            } else if next.token == TokenType::At {
                // primitive property
                self.eat(At);
                let id = self.eat(Id).unwrap();
                if let TokenValue::String(prim) = id {
                    match prim.as_str() {
                        "str" => { new_node = Some(GrammarNode::new(GrammarNodeType::String)); }
                        "bool" => { new_node = Some(GrammarNode::new(GrammarNodeType::Bool)); }
                        "num" => { new_node = Some(GrammarNode::new(GrammarNodeType::Num)); }
                        "until" => {
                            let val = self.parse_literal();
                            new_node = Some(GrammarNode::with_val(GrammarNodeType::Until, val))
                        }
                        _ => { panic!("unexpected primitive type"); }
                    }
                }
            } else {
                if next.token == TokenType::Id {
                    let id = self.eat(Id).unwrap();
                    new_node = Some(GrammarNode::with_val(GrammarNodeType::Id, id));
                } else {
                    break;
                }
            }

            next = self.lexer.peek_token().unwrap();

            // push new node to children
            if let Some(node) = new_node {
                children.push(node);
            }
        }
        return GrammarParser::compress_children_if_possible(children, GrammarNodeType::Expr);
    }

    fn parse_literal(&mut self) -> TokenValue {
        self.eat(SQuote);
        let next = self.lexer.peek_token().unwrap();
        let mut id = TokenValue::Number(0f64);
        if next.token == TokenType::BackSlash {
            self.eat(TokenType::BackSlash);
            let tmp = self.eat(TokenType::Id).unwrap();
            if let TokenValue::String(str) = tmp {
                id = TokenValue::String(format!("\\{}", str));
            }
        } else {
            id = self.eat_any().unwrap();
        }
        self.eat(SQuote);
        return id;
    }
}

#[cfg(test)]
mod tests {
    use crate::grammar::GrammarParser;
    use std::fs;

    #[test]
    fn test_parse() {
        let grammar = GrammarParser::new("grammar.txt");
        fs::write("grammar_out.txt", format!("{:#?}", grammar));
    }
}