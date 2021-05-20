use crate::lexer::{Lexer, Token, TokenValue, TokenType};
use crate::grammar::{Grammar, GrammarParser, GrammarNodeType, GrammarNode};
use std::collections::BinaryHeap;
use crate::pq::PriorityQueue;
use std::env::var;
use crate::ast::{Expr, Value, Block, Identifier, Empty, Assignment, FnDecl, If, While, Variable, Literal, MatrixExpr, FnCall, Ternary};
use crate::errors::Error;
use crate::data::{Data, Primitive};


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
        self.eval(&self.grammar["block"]);
    }

    pub fn eval(&self, node: &GrammarNode) {
        match node.prop {
            GrammarNodeType::String => {}
            GrammarNodeType::Until => {}
            GrammarNodeType::Num => {}
            GrammarNodeType::Bool => {}
            GrammarNodeType::Loop => { self.eval_loop(node) }
            GrammarNodeType::Literal => {}
            GrammarNodeType::Expr => {}
            GrammarNodeType::Order => {}
            GrammarNodeType::Id => {}
            GrammarNodeType::Variation => {}
        }
    }

    /// evaluates a node with a loop
    pub fn eval_loop(&self, node: &GrammarNode) {

    }
}