//
// Created by Pranav Putta on 9/20/20.
//

#ifndef MATHSCRIPT_GLOBAL_H
#define MATHSCRIPT_GLOBAL_H

#include <map>
#include <vector>
#include <string>

#include "token.h"

/**
 * stores a map of all TokenTypes -> string representation
 */
extern std::map<TokenType, std::string> kTokenMap();

/**
 * stores a list of reserved words
 */
extern std::map<std::string, TokenType> kReservedWords();

#endif //MATHSCRIPT_GLOBAL_H
