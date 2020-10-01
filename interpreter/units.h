//
// Created by Pranav Putta on 9/24/20.
//

#ifndef MATHSCRIPT_UNITS_H
#define MATHSCRIPT_UNITS_H


#include <memory>
#include <map>
#include "token.h"

enum class Unit {
    kM, kCM, kMM, kKM, kNone
};

typedef struct AbstractUnitNode {
    virtual bool equals(AbstractUnitNode &node);

    virtual std::string eval() = 0;
} AUN;

typedef std::shared_ptr<AUN> AUNPtr;

struct BinaryUnitNode : AUN {
    AUNPtr left;
    AUNPtr right;
    TokenType op;

    std::string eval() override;
};

struct UnitNode : AUN {
    Unit unit;

    std::string eval() override;
};


#endif //MATHSCRIPT_UNITS_H
