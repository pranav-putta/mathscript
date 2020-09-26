//
// Created by Pranav Putta on 9/19/20.
//

#ifndef MATHSCRIPT_LEXER_H
#define MATHSCRIPT_LEXER_H

#include <string>
#include <vector>
#include <map>

#include "global.h"
#include "token.h"


class Lexer {
private:
    std::string text;
    unsigned int position;
    char current_char;

    /**
     * increments position and updates current_char
     * sets current_char to undefined if position is out of bounds
     */
    void Advance();


    /**
     * skips all whitespace until next token is found
     */
    void IgnoreWhitespace();

    /**
     * tokenizes current character sequence into a number
     * @return Token with an integer or float value
     */
    Token TokenizeNumber();

    /**
     * tokenizes current character sequence into an identifier
     * @return Token with a string value
     */
    Token TokenizeIdentifier();

    /**
     * tokenizes current character sequence
     * @return Token
     */
    Token Tokenize();


public:
    explicit Lexer(std::string text);

    /**
     * finds next token in text
     * @return token
     */
    Token NextToken();

    /**
     * returns the immediate next character in sequence
     * @return next character
     */
    char Peek(int step = 1);

    /**
     * returns the immediate next token in sequence
     * @return next token
     */
    Token PeekToken();
};

#endif //MATHSCRIPT_LEXER_H
