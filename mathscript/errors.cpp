//
// Created by Pranav Putta on 9/20/20.
//

#include "errors.h"
#include "global.h"

UnexpectedSymbolError::UnexpectedSymbolError(char sym, unsigned int pos) : symbol(sym), position(pos) {
    sprintf(message, "unexpected symbol `%c` at `%i`", symbol, position);
}

const char *UnexpectedSymbolError::what() const noexcept {
    return message;
}

UnsupportedOperationError::UnsupportedOperationError(const std::string &type1, const std::string &type2,
                                                     const std::string &op) {
    sprintf(message, "unsupported operation '%s' between '%s' and '%s'", type1.c_str(), type2.c_str(), op.c_str());
}

const char *UnsupportedOperationError::what() const _NOEXCEPT {
    return message;
}

MatrixDimensionError::MatrixDimensionError(int dimR1, int dimR2, int dimC1, int dimC2, char op) {
    sprintf(message, "unsupported dimensions for '%c' operator: { %i x %i } and { %i x %i }", op, dimR1, dimR2, dimC1,
            dimC2);
}


MatrixDimensionError::MatrixDimensionError(const std::string &m) {
    sprintf(message, "%s", m.c_str());
}


const char *MatrixDimensionError::what() const noexcept {
    return message;
}


UndeclaredVariableError::UndeclaredVariableError(const std::string &name) {
    sprintf(message, "variable '%s' not declared!", name.c_str());
}

const char *UndeclaredVariableError::what() const _NOEXCEPT {
    return message;
}

EvaluationError::EvaluationError(const std::string &message) {
    sprintf(this->message, "%s", message.c_str());
}

const char *EvaluationError::what() const _NOEXCEPT {
    return this->message;
}
