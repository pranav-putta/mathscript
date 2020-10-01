//
// Created by Pranav Putta on 9/20/20.
//

#ifndef MATHSCRIPT_ERRORS_H
#define MATHSCRIPT_ERRORS_H

#include <string>
#include <exception>
#include <sstream>
#include "token.h"
#include "data.h"


class UnexpectedSymbolError : public std::exception {
private:
    char symbol;
    unsigned int position;
    char *message{};

public:
    UnexpectedSymbolError(char sym, unsigned int pos);

    [[nodiscard]] const char *what() const _NOEXCEPT override;
};

class UnsupportedOperationError : public std::exception {
private:
    char *message{};

public:
    UnsupportedOperationError(const std::string &type1, const std::string &type2, const std::string &op);

    [[nodiscard]] const char *what() const _NOEXCEPT override;
};

class MatrixDimensionError : public std::exception {
private:
    char *message{};

public:
    MatrixDimensionError(int dimR1, int dimR2, int dimC1, int dimC2, char op);
    explicit MatrixDimensionError(const std::string& message);


    [[nodiscard]] const char *what() const _NOEXCEPT override;

};

class UndeclaredVariableError : public std::exception {
private:
    char *message{};

public:
    explicit UndeclaredVariableError(const std::string& name);


    [[nodiscard]] const char *what() const _NOEXCEPT override;

};

class EvaluationError : public std::exception {
private:
    char *message{};

public:
    explicit EvaluationError(const std::string& message);


    [[nodiscard]] const char *what() const _NOEXCEPT override;

};

#endif //MATHSCRIPT_ERRORS_H
