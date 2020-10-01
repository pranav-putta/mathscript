//
// Created by Pranav Putta on 9/19/20.
//

#ifndef MATHSCRIPT_TEST_H
#define MATHSCRIPT_TEST_H

#include <string>
#include <variant>
#include <map>


/**
 * supported token character sequences
 */
enum class TokenType {
    kNum,
    kId,
    kReserved,
    kReservedValue,
    kEof,
    kAndBool,
    kOrBool,
    kNotEq,
    kDef,
    kEq,
    kLessEq,
    kMoreEq,
    kAddEq,
    kSubEq,
    kMulEq,
    kDivEq,
    kNotUnary,
    kPlus,
    kMinus,
    kMul,
    kDiv,
    kPow,
    kMod,
    kLParen,
    kRParen,
    kLBracket,
    kRBracket,
    kLBrace,
    kRBrace,
    kLArrow,
    kRArrow,
    kSemicolon,
    kComma,
    kAssign,
    kBar,
    kDot,
    kEndL,
    kAndBit,
    kOrBit,
    kColon,
    kTernary
};


/**
 * holds a token with a specified @enum TokenType and value
 */
struct Token {

    TokenType type;
    std::variant<double, std::string> value;

};


#endif //MATHSCRIPT_TEST_H
