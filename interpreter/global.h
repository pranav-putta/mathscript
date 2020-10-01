//
// Created by Pranav Putta on 9/20/20.
//

#ifndef MATHSCRIPT_GLOBAL_H
#define MATHSCRIPT_GLOBAL_H

#include <map>
#include <vector>
#include <string>

#include "token.h"
#include "data.h"

class Global {
private:
    static inline std::map<TokenType, std::string> kTokenMap{};
    static inline std::map<std::string, TokenType> kReservedWords{};
    static inline std::map<std::string, Unit> kUnitMap{};
    static inline std::map<Unit, double> kUnitValues{};

public:
    /**
     * stores a map of all TokenTypes -> string representation
     */
    static std::map<TokenType, std::string> &TokenMap();

    /**
     * stores a list of reserved words
     */
    static std::map<std::string, TokenType> &ReservedWords();

    /**
     * stores a map of all Unit -> string representations
     * @return
     */
    static std::map<std::string, Unit> &UnitMap();

    /**
     * stores a map of all Unit -> double representations
     * @return
     */
    static std::map<Unit, double> &UnitValues();
};

#endif //MATHSCRIPT_GLOBAL_H
