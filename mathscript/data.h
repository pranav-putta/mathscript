//
// Created by Pranav Putta on 9/20/20.
//

#ifndef MATHSCRIPT_DATA_H
#define MATHSCRIPT_DATA_H

#include <utility>
#include <variant>
#include <vector>
#include <string>
#include <any>

typedef std::pair<int, int> cell;
typedef std::vector<std::vector<double>> matrix_t;

enum class ObjectType {
    kNumber, kBoolean, kMatrix, kObject
};

extern std::string ObjectTypeToString(ObjectType type);

struct Object {


    virtual ~Object() = default;

    ObjectType get_object_type();

    ObjectType type;

    Object();

    Object(ObjectType type);
};

typedef std::shared_ptr<Object> ObjPtr;

struct PrimitiveType : Object {
    virtual std::shared_ptr<PrimitiveType> operator+(PrimitiveType &other) = 0;

    virtual std::shared_ptr<PrimitiveType> operator-(PrimitiveType &other) = 0;

    virtual std::shared_ptr<PrimitiveType> operator*(PrimitiveType &other) = 0;

    virtual std::shared_ptr<PrimitiveType> operator/(PrimitiveType &other) = 0;

    virtual std::shared_ptr<PrimitiveType> operator^(PrimitiveType &other) = 0;

    virtual std::shared_ptr<PrimitiveType> operator>(PrimitiveType &other) = 0;

    virtual bool operator==(PrimitiveType &other) = 0;

    virtual bool operator!=(PrimitiveType &other) = 0;

    PrimitiveType(ObjectType type);
};

typedef std::shared_ptr<PrimitiveType> PrimitivePtr;

struct Number : PrimitiveType {
    explicit Number(double d);

    Number(double d, ObjectType type);

    double value{};

    PrimitivePtr operator+(PrimitiveType &other) override;

    PrimitivePtr operator-(PrimitiveType &other) override;

    PrimitivePtr operator*(PrimitiveType &other) override;

    PrimitivePtr operator/(PrimitiveType &other) override;

    PrimitivePtr operator^(PrimitiveType &other) override;

    PrimitivePtr operator>(PrimitiveType &other) override;

    bool operator==(PrimitiveType &other) override;

    bool operator!=(PrimitiveType &other) override;
};

typedef std::shared_ptr<Number> NumberPtr;


struct Matrix : PrimitiveType {
    explicit Matrix(matrix_t matrix, int dimR, int dimC);

    matrix_t matrix;
    int dimR, dimC;

    PrimitivePtr operator+(PrimitiveType &other) override;

    PrimitivePtr operator-(PrimitiveType &other) override;

    PrimitivePtr operator*(PrimitiveType &other) override;

    PrimitivePtr operator/(PrimitiveType &other) override;

    PrimitivePtr operator^(PrimitiveType &other) override;

    PrimitivePtr operator>(PrimitiveType &other) override;

    bool operator==(PrimitiveType &other) override;

    bool operator!=(PrimitiveType &other) override;
};

typedef std::shared_ptr<Matrix> MatrixPtr;


struct Boolean : Number {
    bool boolValue;

    explicit Boolean(bool val);

    std::shared_ptr<Boolean> operator&&(PrimitiveType &other) const;

    std::shared_ptr<Boolean> operator||(PrimitiveType &other) const;

    std::shared_ptr<Boolean> operator!() const;
};


typedef std::shared_ptr<Boolean> BooleanPtr;


#endif //MATHSCRIPT_DATA_H
