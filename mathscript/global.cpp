//
// Created by Pranav Putta on 9/20/20.
//

#include "global.h"

#include <map>

using namespace std;

/**
 * generates reserved token values
 * @return map of reserved tokens
 */
map<std::string, TokenType> kReservedWords() {
    return map<std::string, TokenType>{
            {"true", TokenType::kReservedValue},
            {"false", TokenType::kReservedValue}
    };
}

/**
 * string representation of token types
 * @return map of tokentypes
 */
map<TokenType, string> kTokenMap() {
    return map<TokenType, string>{
            {TokenType::kNum,           "num"},
            {TokenType::kReserved,      "reserved"},
            {TokenType::kReservedValue, "reservedValue"},
            {TokenType::kId,            "id"},
            {TokenType::kEof,           "eof"},
            {TokenType::kAndBool,       "&&"},
            {TokenType::kOrBool,        "||"},
            {TokenType::kNotEq,         "!="},
            {TokenType::kDef,           "=>"},
            {TokenType::kEq,            "=="},
            {TokenType::kLessEq,        "<="},
            {TokenType::kMoreEq,        ">="},
            {TokenType::kAddEq,         "+="},
            {TokenType::kSubEq,         "-="},
            {TokenType::kMulEq,         "*="},
            {TokenType::kDivEq,         "/="},
            {TokenType::kNotUnary,      "!"},
            {TokenType::kPlus,          "+"},
            {TokenType::kMinus,         "-"},
            {TokenType::kMul,           "*"},
            {TokenType::kDiv,           "/"},
            {TokenType::kPow,           "^"},
            {TokenType::kMod,           "%"},
            {TokenType::kLParen,        "("},
            {TokenType::kRParen,        ")"},
            {TokenType::kLBracket,      "["},
            {TokenType::kRBracket,      "]"},
            {TokenType::kLBrace,        "{"},
            {TokenType::kRBrace,        "}"},
            {TokenType::kLArrow,        "<"},
            {TokenType::kRArrow,        ">"},
            {TokenType::kSemicolon,     ";"},
            {TokenType::kComma,         ","},
            {TokenType::kAssign,        "="},
            {TokenType::kBar,           "|"},
            {TokenType::kDot,           "."},
            {TokenType::kEndL,          "\n"},
            {TokenType::kAndBit,        "&"},
            {TokenType::kOrBit,         "|"},
            {TokenType::kColon,         ":"},
            {TokenType::kTernary,       "?"},
    };
}
