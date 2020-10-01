//
// Created by Pranav Putta on 9/20/20.
//

#include "data.h"

#include <utility>
#include "errors.h"
#include "math.h"

using namespace std;


/**
 * convert object type enum to string value
 * @param type object type
 * @return string representation of ObjectType
 */
string ObjectTypeToString(ObjectType type) {
    switch (type) {
        case ObjectType::kNumber:
            return "Number";
        case ObjectType::kBoolean:
            return "Boolean";
        case ObjectType::kMatrix:
            return "Matrix";
        case ObjectType::kObject:
            return "Object";
    }
    return "NULL";
}

ObjectType Object::get_object_type() {
    if (dynamic_cast< Number *>(this)) {
        return ObjectType::kNumber;
    } else if (dynamic_cast<Matrix *>(this)) {
        return ObjectType::kMatrix;
    } else {
        return ObjectType::kBoolean;
    }
}

Object::Object(ObjectType type) : type(type) {

}

Object::Object() : type(ObjectType::kObject) {}

/** Number Implementation */

Number::Number(double d) : value(d), PrimitiveType(ObjectType::kNumber), unit(Unit::kNone) {}

Number::Number(double d, Unit unit) : value(d), PrimitiveType(ObjectType::kNumber), unit(unit) {}

Number::Number(double d, ObjectType type) : value(d), PrimitiveType(type), unit(Unit::kNone) {}


PrimitivePtr Number::operator+(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        return make_shared<Number>((value + num->value));
    }
    throw UnsupportedOperationError("Number", ObjectTypeToString(other.get_object_type()), "+");
}

PrimitivePtr Number::operator-(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        return make_shared<Number>((value - num->value));
    }
    throw UnsupportedOperationError("Number", ObjectTypeToString(other.get_object_type()), "-");
}

PrimitivePtr Number::operator*(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        return make_shared<Number>((value * num->value));
    } else if (dynamic_cast<Matrix *>(&other)) {
        return other * (*this);
    }
    throw UnsupportedOperationError("Number", ObjectTypeToString(other.get_object_type()), "*");
}

PrimitivePtr Number::operator/(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        return make_shared<Number>((value / num->value));
    }
    throw UnsupportedOperationError("Number", ObjectTypeToString(other.get_object_type()), "/");
}

PrimitivePtr Number::operator^(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        return make_shared<Number>((pow(value, num->value)));
    }
    throw UnsupportedOperationError("Number", ObjectTypeToString(other.get_object_type()), "^");
}

PrimitivePtr Number::operator>(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        return make_shared<Boolean>(value > num->value);
    }
    throw UnsupportedOperationError("Number", ObjectTypeToString(other.get_object_type()), "^");
}

bool Number::operator==(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        return value == num->value;
    }
    return false;
}

bool Number::operator!=(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        return value != num->value;
    }
    return false;
}


/** Matrix implementation */
Matrix::Matrix(matrix_t m, int dimR, int dimC) : matrix(std::move(m)), dimR(dimR), dimC(dimC),
                                                 PrimitiveType(ObjectType::kMatrix) {}

PrimitivePtr Matrix::operator+(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    auto mat = dynamic_cast<Matrix *>(&other);
    if (num) {
        matrix_t tmp;
        for (int i = 0; i < dimR; i++) {
            vector<double> row;
            row.reserve(dimC);
            for (int j = 0; j < dimC; j++) {
                row.push_back(matrix[i][j] + num->value);
            }
            tmp.push_back(row);
        }
        return make_shared<Matrix>(tmp, dimR, dimC);
    } else if (mat) {
        if (dimR != mat->dimR || dimC != mat->dimC) {
            throw MatrixDimensionError(dimR, mat->dimR, dimC, mat->dimC, '+');
        }
        matrix_t tmp;
        for (int i = 0; i < dimR; i++) {
            vector<double> row;
            row.reserve(dimC);
            for (int j = 0; j < dimC; j++) {
                row.push_back(matrix[i][j] + mat->matrix[i][j]);
            }
            tmp.push_back(row);
        }
        return make_shared<Matrix>(tmp, dimR, dimC);
    }
    throw UnsupportedOperationError("Matrix", ObjectTypeToString(other.get_object_type()), "+");
}

PrimitivePtr Matrix::operator-(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    auto mat = dynamic_cast<Matrix *>(&other);

    if (num) {
        matrix_t tmp;
        for (int i = 0; i < dimR; i++) {
            vector<double> row;
            row.reserve(dimC);
            for (int j = 0; j < dimC; j++) {
                row.push_back(matrix[i][j] - num->value);
            }
            tmp.push_back(row);
        }
        return make_shared<Matrix>(tmp, dimR, dimC);
    } else if (mat) {
        if (dimR != mat->dimR || dimC != mat->dimC) {
            throw MatrixDimensionError(dimR, mat->dimR, dimC, mat->dimC, '-');
        }
        matrix_t tmp;
        for (int i = 0; i < dimR; i++) {
            vector<double> row;
            row.reserve(dimC);
            for (int j = 0; j < dimC; j++) {
                row.push_back(matrix[i][j] - mat->matrix[i][j]);
            }
            tmp.push_back(row);
        }
        return make_shared<Matrix>(tmp, dimR, dimC);
    }
    throw UnsupportedOperationError("Matrix", ObjectTypeToString(other.get_object_type()), "-");
}

PrimitivePtr Matrix::operator*(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    auto mat = dynamic_cast<Matrix *>(&other);

    if (num) {
        matrix_t tmp;
        for (int i = 0; i < dimR; i++) {
            vector<double> row;
            row.reserve(dimC);
            for (int j = 0; j < dimC; j++) {
                row.push_back(matrix[i][j] * num->value);
            }
            tmp.push_back(row);
        }
        return make_shared<Matrix>(tmp, dimR, dimC);
    } else if (mat) {
        if (dimC != mat->dimR) {
            throw MatrixDimensionError(dimR, mat->dimR, dimC, mat->dimC, '*');
        }
        // todo: vector dot product
        matrix_t tmp;
        tmp.reserve(dimR);
        for (int i = 0; i < dimR; i++) {
            vector<double> row;
            row.reserve(dimC);
            for (int j = 0; j < mat->dimC; j++) {
                double element = 0;
                for (int k = 0; k < dimC; k++) {
                    element += matrix[i][k] * mat->matrix[k][j];
                }
                row.push_back(element);
            }
            tmp.push_back(row);
        }
        return make_shared<Matrix>(tmp, dimR, dimC);
    }
    throw UnsupportedOperationError("Matrix", ObjectTypeToString(other.get_object_type()), "*");
}

PrimitivePtr Matrix::operator/(PrimitiveType &other) {
    throw UnsupportedOperationError("Matrix", ObjectTypeToString(other.get_object_type()), "/");
}

PrimitivePtr Matrix::operator^(PrimitiveType &other) {
    auto num = dynamic_cast<Number *>(&other);
    if (num) {
        auto m = new Matrix(*this);
        if (dimR != dimC) {
            throw MatrixDimensionError("matrix must be square to take power");
        }
        for (int i = 0; i < num->value; i++) {
            m = dynamic_cast<Matrix *>(m->operator*(*this).get());
        }
        return shared_ptr<PrimitiveType>(m);
    }
    throw UnsupportedOperationError("Matrix", ObjectTypeToString(other.get_object_type()), "^");
}

PrimitivePtr Matrix::operator>(PrimitiveType &other) {
    throw UnsupportedOperationError("Matrix", ObjectTypeToString(other.get_object_type()), "/");
}

bool Matrix::operator==(PrimitiveType &other) {
    auto mat = dynamic_cast<Matrix *>(&other);

    if (mat) {
        if (dimR != mat->dimR || dimC != mat->dimC) {
            return false;
        }
        for (int i = 0; i < dimR; i++) {
            for (int j = 0; j < dimC; j++) {
                if (matrix[i][j] != mat->matrix[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }
    return false;
}

bool Matrix::operator!=(PrimitiveType &other) {
    return !(this->operator==(other));
}

Boolean::Boolean(bool val) : Number(val ? 1 : 0, ObjectType::kBoolean), boolValue(val) {}

BooleanPtr Boolean::operator&&(PrimitiveType &other) const {
    auto b = dynamic_cast<Boolean *>(&other);
    if (b) {
        return make_shared<Boolean>(this->boolValue && b->boolValue);
    }
    throw UnsupportedOperationError("Boolean", ObjectTypeToString(other.get_object_type()), "&&");
}

BooleanPtr Boolean::operator||(PrimitiveType &other) const {
    auto b = dynamic_cast<Boolean *>(&other);
    if (b) {
        return make_shared<Boolean>(this->boolValue || b->boolValue);
    }
    throw UnsupportedOperationError("Boolean", ObjectTypeToString(other.get_object_type()), "&&");
}

BooleanPtr Boolean::operator!() const {
    return make_shared<Boolean>(!boolValue);
}

PrimitiveType::PrimitiveType(ObjectType type) : Object(type) {

}
