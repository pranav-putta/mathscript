//
// Created by Pranav Putta on 9/24/20.
//

#include "units.h"
#include "global.h"


bool AbstractUnitNode::equals(AbstractUnitNode &node) {
    return node.eval() == this->eval();
}

std::string BinaryUnitNode::eval() {
    return left->eval() + Global::TokenMap()[op] + right->eval();
}

std::string UnitNode::eval() {
    return "";
}
