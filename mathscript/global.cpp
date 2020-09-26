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
map<std::string, TokenType> &Global::ReservedWords() {
    if (kReservedWords.empty()) {
        kReservedWords = map<std::string, TokenType>{
                {"true",  TokenType::kReservedValue},
                {"false", TokenType::kReservedValue},

        };
    }
    return kReservedWords;
}

/**
 * string representation of token types
 * @return map of tokentypes
 */
map<TokenType, string> &Global::TokenMap() {
    if (kTokenMap.empty()) {
        kTokenMap = map<TokenType, string>{
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
    return kTokenMap;
}

map<std::string, Unit> &Global::UnitMap() {
    if (kUnitMap.empty()) {
        kUnitMap = map<string, Unit>{
                {"none", Unit::kNone},
                {"m",    Unit::kM},
                {"cm",   Unit::kCM},
                {"km",   Unit::kKM,},
                {"mm",   Unit::kMM,}
        };
    }
    return kUnitMap;
}

map<Unit, double> &Global::UnitValues() {
    if (kUnitValues.empty()) {
        kUnitValues = map<Unit, double>{
                {Unit::kNone, 1},
                {Unit::kM,    1},
                {Unit::kCM,   0.01},
                {Unit::kKM,   1000},
                {Unit::kMM,   0.001}
        };
    }
    return kUnitValues;
}
