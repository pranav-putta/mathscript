//
// Created by Pranav Putta on 9/19/20.
//
#include "lexer.h"
#include "errors.h"

#include <utility>

using namespace std;

/**
 * constructs a new lexer from text
 * @param t
 */
Lexer::Lexer(std::string t) : text(std::move(t)), position(0) {
    if (!text.empty()) {
        current_char = text.at(0);
    } else {
        current_char = -1;
    }
}

/**
 * increment position value and set current_char to next element in text
 * if position reaches the end of text length, sets @param current_char to -1
 */
void Lexer::Advance() {
    position++;
    if (position < text.length()) {
        current_char = text.at(position);
    } else {
        current_char = -1;
    }
}

/**
 * checks for the next character in the string without advancing the current position
 * @param step size, defaults to 1
 * @return character specified step size away
 */
char Lexer::Peek(int step) {
    if (position + step < 0 || position + step >= text.length()) {
        return -1;
    } else {
        return text.at(position + step);
    }
}


/**
 * advances current character sequence position until character is not
 * a space
 */
void Lexer::IgnoreWhitespace() {
    while (isspace(current_char) && current_char != '\n') {
        Advance();
    }
}

/**
 * converts a number sequence into an integer or double token
 * @return token
 */
Token Lexer::TokenizeNumber() {
    string num;
    // aggregate consecutive numbers as integer
    while (isdigit(current_char)) {
        num += current_char;
        Advance();
    }

    // check for decimal point
    if (current_char == '.') {
        num += current_char;
        Advance();
        // make sure next character is a digit
        while (isdigit(current_char)) {
            num += current_char;
            Advance();
        }
    }
    return Token{TokenType::kNum, std::stod(num)};
}

/**
 * matches character with associated token
 * @return Token, value string if symbol, double/int if number
 */
Token Lexer::TokenizeIdentifier() {
    string str;
    while (isalnum(current_char)) {
        str += current_char;
        Advance();
    }
    int ct = Global::ReservedWords().count(str);
    return ct != 0 ? Token{Global::ReservedWords()[str], str} : Token{TokenType::kId, str};
}

/**
 * tokenizes the current character
 * @return token
 */
Token Lexer::Tokenize() {
    // ignore all whitespace
    IgnoreWhitespace();

    if (current_char == -1) {
        // if reached end of file, return eof
        return Token{TokenType::kEof, "eof"};
    } else if (isdigit(current_char)) {
        // check for digits
        return TokenizeNumber();
    } else if (isalnum(current_char)) {
        // check for alphanumeric sequence
        return TokenizeIdentifier();
    } else {
        // check for each character
        for (auto const &tok : Global::TokenMap()) {
            string tok_str = tok.second, txt(1, current_char);
            int n = tok_str.length();

            // if token to check is multiple characters, peek forward
            for (int step = 1; step < n; step++) {
                txt += Peek(step);
            }

            // if token to check and text match
            if (tok_str == txt) {
                for (int i = 0; i < n; i++) {
                    Advance();
                }
                return Token{tok.first, tok.second};
            }
        }
    }

    throw UnexpectedSymbolError(current_char, position);
}

/**
 * tokenizes current character and advances position
 * @return tokenized character
 */
Token Lexer::NextToken() {
    Token next = Tokenize();
    return next;
}

/**
 * tokenizes current character but prevents position from advancing
 * @return
 */
Token Lexer::PeekToken() {
    unsigned int posTmp = position;
    char charTmp = current_char;
    Token tok = Tokenize();
    position = posTmp;
    current_char = charTmp;
    return tok;
}




