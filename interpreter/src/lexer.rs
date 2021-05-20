use crate::global;


/// Lexer struct
pub struct Lexer {
    text: Vec<u8>,
    pub current: char,
    pub position: usize,
}

/// TokenType enum
#[derive(Copy, Clone, PartialEq, Debug, Eq, Hash)]
pub enum TokenType {
    Num,
    Id,
    Reserved,
    ReservedValue,
    Eof,
    AndBool,
    OrBool,
    NotEq,
    Def,
    Eq,
    LessEq,
    MoreEq,
    AddEq,
    SubEq,
    MulEq,
    DivEq,
    NotUnary,
    Plus,
    Minus,
    Mul,
    Div,
    Pow,
    Mod,
    LParen,
    RParen,
    LBracket,
    RBracket,
    LBrace,
    RBrace,
    LArrow,
    RArrow,
    Semicolon,
    Comma,
    Assign,
    Dot,
    EndL,
    AndBit,
    OrBit,
    Colon,
    Ternary,
    SQuote,
    DQuote,
    At,
    BackSlash,
    HashTag,
}

/// TokenType implementation
impl TokenType {
    fn match_double_symbol(c: &str) -> Option<TokenType> {
        return match c {
            "&&" => { Some(TokenType::AndBool) }
            "||" => { Some(TokenType::OrBool) }
            "!=" => { Some(TokenType::NotEq) }
            "=>" => { Some(TokenType::Def) }
            "==" => { Some(TokenType::Eq) }
            "<=" => { Some(TokenType::LessEq) }
            ">=" => { Some(TokenType::MoreEq) }
            "+=" => { Some(TokenType::AddEq) }
            "-=" => { Some(TokenType::SubEq) }
            "*=" => { Some(TokenType::MulEq) }
            "/=" => { Some(TokenType::DivEq) }
            _ => { None }
        };
    }
    fn match_single_symbol(c: &str) -> Option<TokenType> {
        return match c {
            "!" => { Some(TokenType::NotUnary) }
            "+" => { Some(TokenType::Plus) }
            "-" => { Some(TokenType::Minus) }
            "*" => { Some(TokenType::Mul) }
            "/" => { Some(TokenType::Div) }
            "^" => { Some(TokenType::Pow) }
            "%" => { Some(TokenType::Mod) }
            "(" => { Some(TokenType::LParen) }
            ")" => { Some(TokenType::RParen) }
            "[" => { Some(TokenType::LBracket) }
            "]" => { Some(TokenType::RBracket) }
            "{" => { Some(TokenType::LBrace) }
            "}" => { Some(TokenType::RBrace) }
            "<" => { Some(TokenType::LArrow) }
            ">" => { Some(TokenType::RArrow) }
            ";" => { Some(TokenType::Semicolon) }
            "," => { Some(TokenType::Comma) }
            "=" => { Some(TokenType::Assign) }
            "|" => { Some(TokenType::OrBit) }
            "." => { Some(TokenType::Dot) }
            "\n" => { Some(TokenType::EndL) }
            "&" => { Some(TokenType::AndBit) }
            ":" => { Some(TokenType::Colon) }
            "?" => { Some(TokenType::Ternary) }
            "'" => { Some(TokenType::SQuote) }
            "\"" => { Some(TokenType::DQuote) }
            "@" => { Some(TokenType::At) }
            "\\" => { Some(TokenType::BackSlash) }
            "#" => { Some(TokenType::HashTag) }
            _ => { None }
        };
    }

    fn value(&self) -> &str {
        return match self {
            TokenType::Num => { "num" }
            TokenType::Id => { "id" }
            TokenType::Reserved => { "reserved" }
            TokenType::ReservedValue => { "reservedValue" }
            TokenType::Eof => { "eof" }
            TokenType::AndBool => { "&&" }
            TokenType::OrBool => { "||" }
            TokenType::NotEq => { "!=" }
            TokenType::Def => { "=>" }
            TokenType::Eq => { "==" }
            TokenType::LessEq => { "<=" }
            TokenType::MoreEq => { ">=" }
            TokenType::AddEq => { "+=" }
            TokenType::SubEq => { "-=" }
            TokenType::MulEq => { "*=" }
            TokenType::DivEq => { "/=" }
            TokenType::NotUnary => { "!" }
            TokenType::Plus => { "+" }
            TokenType::Minus => { "-" }
            TokenType::Mul => { "*" }
            TokenType::Div => { "/" }
            TokenType::Pow => { "^" }
            TokenType::Mod => { "%" }
            TokenType::LParen => { "(" }
            TokenType::RParen => { ")" }
            TokenType::LBracket => { "[" }
            TokenType::RBracket => { "]" }
            TokenType::LBrace => { "{" }
            TokenType::RBrace => { "}" }
            TokenType::RArrow => { ">" }
            TokenType::LArrow => { "<" }
            TokenType::Semicolon => { ";" }
            TokenType::Comma => { "," }
            TokenType::Assign => { "=" }
            TokenType::Dot => { "." }
            TokenType::EndL => { "\n" }
            TokenType::AndBit => { "&" }
            TokenType::OrBit => { "|" }
            TokenType::Colon => { ":" }
            TokenType::Ternary => { "?" }
            TokenType::SQuote => { "'" }
            TokenType::At => { "@" }
            TokenType::BackSlash => { "\\" }
            TokenType::HashTag => { "#" }
            TokenType::DQuote => { "\"" }
        };
    }
}

/// TokenValue enum, stores numbers and strings
#[derive(Debug, Clone)]
pub enum TokenValue {
    Number(f64),
    String(String),
}

/// Token structure
#[derive(Clone, Debug)]
pub struct Token {
    pub token: TokenType,
    pub value: TokenValue,
}

impl Token {
    /// creates empty token
    pub fn eof() -> Token {
        Token { token: TokenType::Eof, value: TokenValue::String(TokenType::Eof.value().to_string()) }
    }
}

/// Lexer private utility implementations
impl Lexer {
    /// checks if lexer has another element
    fn has_next(&self) -> bool {
        return self.position <= self.text.len() - 1;
    }

    /// increment position value and set current_char to next element in text
    /// if position reaches the end of text length, sets @param current to -1
    fn advance(&mut self) {
        // increment position
        self.position += 1;

        // check if new position is possible
        if self.position < self.text.len() {
            self.current = self.text[self.position] as char;
        } else {
            self.current = 0 as char;
        }
    }

    /// advances current character sequence position until character is not a space
    fn ignore_whitespace(&mut self) {
        while self.current.is_whitespace() && self.current != '\n' {
            self.advance()
        }
    }
}

/// Lexer tokenizer implementations
impl Lexer {
    /// tokenizes next number
    fn tokenize_number(&mut self) -> Token {
        let mut num = String::new();

        while self.current.is_ascii_digit() {
            num.push(self.current);
            self.advance();
        }

        // check for a decimal point, floating point num
        if self.current == '.' {
            num.push(self.current);
            self.advance();

            // keep adding next character
            while self.current.is_ascii_digit() {
                num.push(self.current);
                self.advance();
            }
        }

        // construct a new token object with specified number as value
        Token { token: TokenType::Num, value: TokenValue::Number(num.parse::<f64>().unwrap()) }
    }

    /// converts a string of characters into an identifier
    fn tokenize_identifier(&mut self) -> Token {
        let mut str = String::new();

        while self.current.is_alphanumeric() || self.current == '_' {
            str.push(self.current);
            self.advance();
        }

        // check if identifier is a reserved word
        if global::RESERVED_WORDS.contains(&str.as_str()) {
            Token { token: TokenType::ReservedValue, value: TokenValue::String(str) }
        } else {
            Token { token: TokenType::Id, value: TokenValue::String(str) }
        }
    }

    /// tokenizes the current character stream
    fn tokenize(&mut self) -> Result<Token, String> {
        // ignore white space
        self.ignore_whitespace();

        return if !self.has_next() {
            //  reached end of file
            Ok(Token { token: TokenType::Eof, value: TokenValue::String(TokenType::Eof.value().to_string()) })
        } else if self.current.is_ascii_digit() {
            // tokenize a number
            Ok(self.tokenize_number())
        } else if self.current.is_alphanumeric() {
            // tokenize a identifier
            Ok(self.tokenize_identifier())
        } else {
            // tokenize any reserve character
            // search single
            let mut tok_str = String::from(self.current);
            let mut result = TokenType::match_single_symbol(tok_str.as_str());
            if result.is_none() {
                return Err(format!("unexpected symbol {}", tok_str));
            }

            let mut tok = result.unwrap();
            self.advance();

            // check next token for symbol with 2 characters
            if self.has_next() {
                tok_str.push(self.current);
                result = TokenType::match_double_symbol(tok_str.as_str());
                if result.is_some() {
                    tok = result.unwrap();
                    self.advance();
                } else {
                    tok_str.pop();
                }
            }
            Ok(Token { token: tok, value: TokenValue::String(tok_str) })
        };
    }
}

/// Lexer implementation
impl Lexer {
    /// constructs a new lexer given an input string
    pub fn new(text: &str) -> Lexer {
        let cur;
        let bytes = text.as_bytes();
        if !text.is_empty() {
            cur = bytes[0] as char;
        } else {
            cur = 0 as char;
        }
        // construct a new lexer
        Lexer { text: Vec::from(bytes), position: 0, current: cur }
    }


    /// checks for the next character in the string without advancing the current position
    /// # Arguments
    /// * `step` size, defaults to 1
    /// # Return
    /// @return character specified step size away
    pub fn peek(&self, step: i32) -> Option<char> {
        // check if new position is valid
        if self.position as i32 + step < 0 || self.position as i32 + step >= self.text.len() as i32 {
            return None;
        }
        return Some(self.text[(self.position as i32 + step) as usize] as char);
    }

    /// retrieves next token in text
    pub fn next_token(&mut self) -> Result<Token, String> {
        self.tokenize()
    }

    /// retrieves next token without advancing the current position
    pub fn peek_token(&mut self) -> Result<Token, String> {
        let tmp_pos = self.position;
        let tmp_char = self.current;
        let tok = self.tokenize();
        self.position = tmp_pos;
        self.current = tmp_char;
        return tok;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_logical() {
        let text = "true && true";
        let mut lexer = Lexer::new(text);

        let mut tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::ReservedValue);
        tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::AndBool);
        tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::ReservedValue);
        println!("{:?}", tok.token);
    }

    #[test]
    fn test_arithmetic() {
        let text = "1 + 2 * 3 * 4";
        let mut lexer = Lexer::new(text);

        let mut tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::Num);
        tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::Plus);
        tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::Num);
        tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::Mul);
        tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::Num);
        tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::Mul);
        tok = lexer.next_token().unwrap();
        assert_eq!(tok.token, TokenType::Num);
        println!("{:?}", tok.value);
    }
}