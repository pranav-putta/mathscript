use std::ops::{Add, Sub, Mul, Div, Neg, Index};
use crate::errors::Error;
use std::cmp::Ordering;
use serde::Serializer;
use serde::ser::SerializeStruct;

type NumberType = f64;
type BooleanType = bool;
pub type MatrixType = Vec<Vec<Primitive>>;

#[derive(Clone, Debug)]
pub enum Data {
    Matrix(Matrix),
    Primitive(Primitive),
}

impl Data {
    pub fn num(n: f64) -> Self {
        Data::Primitive(Primitive::Number(n))
    }

    pub fn bool(b: bool) -> Self {
        Data::Primitive(Primitive::Bool(b))
    }

    pub fn str(s: String) -> Self {
        Data::Primitive(Primitive::Str(s))
    }

    pub fn pow(&self, rhs: Data) -> Result<Data, Error> {
        return match self {
            Data::Matrix(matrix) => {
                matrix.pow(rhs)
            }
            Data::Primitive(prim) => {
                return match rhs {
                    Data::Matrix(matrix) => {
                        Err(Error::NotImplemented)
                    }
                    Data::Primitive(prim2) => {
                        Ok(Data::Primitive(prim.pow(prim2)))
                    }
                };
            }
        };
    }
}

#[derive(Clone, Debug)]
pub struct Matrix {
    pub matrix: MatrixType,
    pub dims: (usize, usize),
}

impl Matrix {
    fn new(matrix: Vec<Vec<Primitive>>) -> Matrix {
        let r = matrix.len();
        let c;
        if r > 0 {
            c = matrix[0].len();
        } else {
            c = 0;
        }

        Matrix { matrix, dims: (r, c) }
    }
    pub fn pow(&self, rhs: Data) -> Result<Data, Error> {
        return match rhs {
            Data::Matrix(matrix) => {
                Err(Error::NotImplemented)
            }
            Data::Primitive(num) => {
                let mut m = self.clone();

                for row in 0..self.dims.0 {
                    for col in 0..self.dims.1 {
                        m.matrix[row][col] = m[(row, col)].clone().pow(num.clone());
                    }
                }
                Ok(Data::Matrix(m))
            }
        };
    }
}

impl PartialEq for Matrix {
    fn eq(&self, other: &Self) -> bool {
        if self.dims != other.dims {
            return false;
        }

        for row in 0..self.dims.0 {
            for col in 0..self.dims.1 {
                if self[(row, col)] != other[(row, col)] {
                    return false;
                }
            }
        }

        return true;
    }

    fn ne(&self, other: &Self) -> bool {
        !self.eq(other)
    }
}

impl Index<(usize, usize)> for Matrix {
    type Output = Primitive;

    fn index(&self, index: (usize, usize)) -> &Self::Output {
        &self.matrix[index.0][index.1]
    }
}

#[derive(Clone, Debug)]
pub enum Primitive {
    Number(f64),
    Bool(bool),
    Str(String),
}

impl Primitive {
    pub fn new_num(num: f64) -> Self {
        return Primitive::Number(num);
    }
    /// converts primitive to a floating point number
    fn to_num(&self) -> f64 {
        match self {
            Primitive::Number(n) => {
                *n
            }
            Primitive::Bool(b) => {
                match b {
                    true => 1.0,
                    false => 0.0
                }
            }
            _ => { unimplemented!() }
        }
    }

    pub fn pow(&self, other: Primitive) -> Primitive {
        return Primitive::Number(self.to_num().powf(other.to_num()));
    }
}

/// prim + prim
impl Add<Primitive> for Primitive {
    type Output = Primitive;

    fn add(self, rhs: Primitive) -> Self::Output {
        return Primitive::Number(self.to_num() + rhs.to_num());
    }
}

/// prim - prim
impl Sub<Primitive> for Primitive {
    type Output = Primitive;

    fn sub(self, rhs: Primitive) -> Self::Output {
        return Primitive::Number(self.to_num() - rhs.to_num());
    }
}

/// prim * prim
impl Mul<Primitive> for Primitive {
    type Output = Primitive;

    fn mul(self, rhs: Primitive) -> Self::Output {
        return Primitive::Number(self.to_num() * rhs.to_num());
    }
}

/// prim / prim
impl Div<Primitive> for Primitive {
    type Output = Result<Primitive, Error>;

    fn div(self, rhs: Primitive) -> Self::Output {
        if rhs.to_num() == 0f64 {
            return Err(Error::DivideByZero);
        }
        return Ok(Primitive::Number(self.to_num() / rhs.to_num()));
    }
}

impl PartialEq for Primitive {
    fn eq(&self, other: &Self) -> bool {
        return self.to_num() == other.to_num();
    }

    fn ne(&self, other: &Self) -> bool {
        return self.to_num() != other.to_num();
    }
}

impl PartialOrd for Primitive {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        unimplemented!()
    }

    fn lt(&self, other: &Self) -> bool {
        return self.to_num() < other.to_num();
    }

    fn le(&self, other: &Self) -> bool {
        return self.to_num() <= other.to_num();
    }

    fn gt(&self, other: &Self) -> bool {
        return self.to_num() > other.to_num();
    }

    fn ge(&self, other: &Self) -> bool {
        return self.to_num() >= other.to_num();
    }
}

/// -prim
impl Neg for Primitive {
    type Output = Primitive;

    fn neg(self) -> Self::Output {
        match self {
            Primitive::Number(n) => {
                return Primitive::Number(-n);
            }
            Primitive::Bool(b) => {
                match b {
                    true => { Primitive::Number(-1f64) }
                    false => { Primitive::Number(0f64) }
                }
            }
            _ => { unimplemented!() }
        }
    }
}

/// prim + matrix
impl Add<Matrix> for Primitive {
    type Output = Result<Data, Error>;

    fn add(self, rhs: Matrix) -> Self::Output {
        return rhs.add(Data::Primitive(self));
    }
}

/// prim - matrix
///     = matrix + (-prim)
impl Sub<Matrix> for Primitive {
    type Output = Result<Data, Error>;

    fn sub(self, rhs: Matrix) -> Self::Output {
        return rhs.add(Data::Primitive(-self));
    }
}

/// prim * matrix
impl Mul<Matrix> for Primitive {
    type Output = Result<Data, Error>;

    fn mul(self, rhs: Matrix) -> Self::Output {
        return rhs.mul(Data::Primitive(self));
    }
}

/// prim / matrix
impl Div<Matrix> for Primitive {
    type Output = Result<Data, Error>;

    fn div(self, _: Matrix) -> Self::Output {
        Err(Error::NotImplemented)
    }
}

/// implementation of matrix addition operations
/// matrix + (matrix | prim)
impl Add<Data> for Matrix {
    type Output = Result<Data, Error>;

    fn add(self, rhs: Data) -> Self::Output {
        return match rhs {
            Data::Matrix(matrix) => {
                // check for dimension error
                if matrix.dims != self.dims {
                    return Err(Error::WrongDimension);
                }

                let mut m = self.clone();

                for row in 0..self.dims.0 {
                    for col in 0..self.dims.1 {
                        m.matrix[row][col] = m[(row, col)].clone() + matrix[(row, col)].clone();
                    }
                }
                Ok(Data::Matrix(m))
            }
            Data::Primitive(num) => {
                let mut m = self.clone();

                for row in 0..self.dims.0 {
                    for col in 0..self.dims.1 {
                        m.matrix[row][col] = m[(row, col)].clone() + num.clone();
                    }
                }
                Ok(Data::Matrix(m))
            }
        };
    }
}

/// implementation of matrix subtraction operations
/// matrix - (matrix | prim)
impl Sub<Data> for Matrix {
    type Output = Result<Data, Error>;

    fn sub(self, rhs: Data) -> Self::Output {
        return match rhs {
            Data::Matrix(matrix) => {
                // check for dimension error
                if matrix.dims != self.dims {
                    return Err(Error::WrongDimension);
                }

                let mut m = self.clone();

                for row in 0..self.dims.0 {
                    for col in 0..self.dims.1 {
                        m.matrix[row][col] = m[(row, col)].clone() - matrix[(row, col)].clone();
                    }
                }
                Ok(Data::Matrix(m))
            }
            Data::Primitive(num) => {
                let mut m = self.clone();

                for row in 0..self.dims.0 {
                    for col in 0..self.dims.1 {
                        m.matrix[row][col] = m[(row, col)].clone() - num.clone();
                    }
                }
                Ok(Data::Matrix(m))
            }
        };
    }
}

/// matrix * prim
/// matrix * matrix = dot product
impl Mul<Data> for Matrix {
    type Output = Result<Data, Error>;

    fn mul(self, rhs: Data) -> Self::Output {
        return match rhs {
            Data::Matrix(matrix) => {
                // check for dimension error
                if self.dims.1 != matrix.dims.0 {
                    return Err(Error::WrongDimension);
                }

                let mut tmp: Vec<Vec<Primitive>> = Vec::new();

                // compute product
                for row in 0..self.dims.0 {
                    tmp.push(Vec::new());
                    for col in 0..matrix.dims.1 {
                        let mut element: Primitive = Primitive::Number(0.0);
                        for k in 0..self.dims.1 {
                            element = element + (self[(row, k)].clone() * matrix[(k, col)].clone());
                        }
                        tmp[row].push(element);
                    }
                }

                Ok(Data::Matrix(Matrix::new(tmp)))
            }
            Data::Primitive(num) => {
                let mut m = self.clone();

                for row in 0..self.dims.0 {
                    for col in 0..self.dims.1 {
                        m.matrix[row][col] = m[(row, col)].clone() * num.clone();
                    }
                }
                Ok(Data::Matrix(m))
            }
        };
    }
}

/// matrix / prim
/// matrix / matrix = error
impl Div<Data> for Matrix {
    type Output = Result<Data, Error>;

    fn div(self, rhs: Data) -> Self::Output {
        return match rhs {
            Data::Matrix(_) => {
                Err(Error::NotImplemented)
            }
            Data::Primitive(num) => {
                if num.to_num() == 0.0 {
                    return Err(Error::DivideByZero);
                }

                let mut m = self.clone();

                for row in 0..self.dims.0 {
                    for col in 0..self.dims.1 {
                        let tmp = m[(row, col)].clone() / num;
                        return match tmp {
                            Ok(prim) => {
                                m.matrix[row][col] = prim;
                                Ok(Data::Matrix(m))
                            }
                            Err(err) => {
                                Err(err)
                            }
                        };
                    }
                }
                Ok(Data::Matrix(m))
            }
        };
    }
}

impl Neg for Matrix {
    type Output = Matrix;

    fn neg(self) -> Self::Output {
        let mut matrix = self.clone();

        for row in 0..matrix.dims.0 {
            for col in 0..matrix.dims.1 {
                matrix.matrix[row][col] = -matrix[(row, col)].clone();
            }
        }

        matrix
    }
}

/// data + data
impl Add<Data> for Data {
    type Output = Result<Data, Error>;

    fn add(self, rhs: Data) -> Self::Output {
        return match self {
            Data::Matrix(matrix) => {
                matrix + rhs
            }
            Data::Primitive(prim) => {
                return match rhs {
                    Data::Matrix(matrix) => {
                        prim + matrix
                    }
                    Data::Primitive(prim2) => {
                        Ok(Data::Primitive(prim + prim2))
                    }
                };
            }
        };
    }
}

/// data - data
impl Sub<Data> for Data {
    type Output = Result<Data, Error>;

    fn sub(self, rhs: Data) -> Self::Output {
        return match self {
            Data::Matrix(matrix) => {
                matrix - rhs
            }
            Data::Primitive(prim) => {
                return match rhs {
                    Data::Matrix(matrix) => {
                        prim - matrix
                    }
                    Data::Primitive(prim2) => {
                        Ok(Data::Primitive(prim - prim2))
                    }
                };
            }
        };
    }
}

/// data * data
impl Mul<Data> for Data {
    type Output = Result<Data, Error>;

    fn mul(self, rhs: Data) -> Self::Output {
        return match self {
            Data::Matrix(matrix) => {
                matrix * rhs
            }
            Data::Primitive(prim) => {
                return match rhs {
                    Data::Matrix(matrix) => {
                        prim * matrix
                    }
                    Data::Primitive(prim2) => {
                        Ok(Data::Primitive(prim * prim2))
                    }
                };
            }
        };
    }
}

/// data / data
impl Div<Data> for Data {
    type Output = Result<Data, Error>;

    fn div(self, rhs: Data) -> Self::Output {
        return match self {
            Data::Matrix(matrix) => {
                matrix / rhs
            }
            Data::Primitive(prim) => {
                return match rhs {
                    Data::Matrix(matrix) => {
                        prim / matrix
                    }
                    Data::Primitive(prim2) => {
                        let out = prim / prim2;
                        return match out {
                            Ok(prim) => {
                                Ok(Data::Primitive(prim))
                            }
                            Err(err) => {
                                Err(err)
                            }
                        };
                    }
                };
            }
        };
    }
}

impl PartialEq for Data {
    fn eq(&self, other: &Self) -> bool {
        return match self {
            Data::Matrix(m1) => {
                match other {
                    Data::Matrix(m2) => { m1 == m2 }
                    Data::Primitive(_) => { false }
                }
            }
            Data::Primitive(p1) => {
                match other {
                    Data::Matrix(_) => { false }
                    Data::Primitive(p2) => { p1 == p2 }
                }
            }
        };
    }

    fn ne(&self, other: &Self) -> bool {
        !self.eq(other)
    }
}

impl PartialOrd for Data {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        unimplemented!()
    }

    fn lt(&self, other: &Self) -> bool {
        return match self {
            Data::Matrix(m1) => {
                match other {
                    Data::Matrix(m2) => { false }
                    Data::Primitive(_) => { false }
                }
            }
            Data::Primitive(p1) => {
                match other {
                    Data::Matrix(_) => { false }
                    Data::Primitive(p2) => { p1 < p2 }
                }
            }
        };
    }

    fn le(&self, other: &Self) -> bool {
        return self < other || self == other;
    }

    fn gt(&self, other: &Self) -> bool {
        return match self {
            Data::Matrix(m1) => {
                match other {
                    Data::Matrix(m2) => { false }
                    Data::Primitive(_) => { false }
                }
            }
            Data::Primitive(p1) => {
                match other {
                    Data::Matrix(_) => { false }
                    Data::Primitive(p2) => { p1 > p2 }
                }
            }
        };
    }

    fn ge(&self, other: &Self) -> bool {
        return self > other || self == other;
    }
}

impl Neg for Data {
    type Output = Data;

    fn neg(self) -> Self::Output {
        return match self {
            Data::Matrix(matrix) => {
                Data::Matrix(matrix.neg())
            }
            Data::Primitive(prim) => {
                Data::Primitive(prim.neg())
            }
        };
    }
}

/// boolean operations
impl Primitive {
    pub fn bit_and(self, other: Primitive) -> Result<Primitive, Error> {
        match self {
            Primitive::Bool(b1) => {
                match other {
                    Primitive::Bool(b2) => {
                        return Ok(Primitive::Bool(b1 & b2));
                    }
                    _ => {}
                };
            }
            _ => {}
        }

        Err(Error::NotImplemented)
    }

    pub fn bit_or(self, other: Primitive) -> Result<Primitive, Error> {
        match self {
            Primitive::Bool(b1) => {
                match other {
                    Primitive::Bool(b2) => {
                        return Ok(Primitive::Bool(b1 | b2));
                    }
                    _ => {}
                };
            }
            _ => {}
        }

        Err(Error::NotImplemented)
    }

    pub fn bool_and(self, other: Primitive) -> Result<Primitive, Error> {
        match self {
            Primitive::Bool(b1) => {
                match other {
                    Primitive::Bool(b2) => {
                        return Ok(Primitive::Bool(b1 && b2));
                    }
                    _ => {}
                };
            }
            _ => {}
        }

        Err(Error::NotImplemented)
    }

    pub fn bool_or(self, other: Primitive) -> Result<Primitive, Error> {
        match self {
            Primitive::Bool(b1) => {
                match other {
                    Primitive::Bool(b2) => {
                        return Ok(Primitive::Bool(b1 || b2));
                    }
                    _ => {}
                };
            }
            _ => {}
        }

        Err(Error::NotImplemented)
    }
    pub fn bool_not(self) -> Result<Primitive, Error> {
        match self {
            Primitive::Bool(b1) => {
                return Ok(Primitive::Bool(!b1));
            }
            _ => {}
        }

        Err(Error::NotImplemented)
    }

    pub fn lt(self, other: Primitive) -> Primitive {
        return Primitive::Bool(self.to_num() < other.to_num());
    }

    pub fn gt(self, other: Primitive) -> Primitive {
        return Primitive::Bool(self.to_num() > other.to_num());
    }

    pub fn le(self, other: Primitive) -> Primitive {
        return Primitive::Bool(self.to_num() <= other.to_num());
    }

    pub fn ge(self, other: Primitive) -> Primitive {
        return Primitive::Bool(self.to_num() >= other.to_num());
    }
}

impl serde::ser::Serialize for Data {
    fn serialize<S>(&self, serializer: S) -> Result<<S as Serializer>::Ok, <S as Serializer>::Error> where
        S: Serializer {
        let mut state = serializer.serialize_struct("Data", 1).ok().unwrap();
        match self {
            Data::Matrix(m) => {
                state.serialize_field("data", m);
            }
            Data::Primitive(p) => {
                state.serialize_field("data", p);
            }
        }
        state.end()
    }
}

impl serde::ser::Serialize for Primitive {
    fn serialize<S>(&self, serializer: S) -> Result<<S as Serializer>::Ok, <S as Serializer>::Error> where
        S: Serializer {
        let mut state = serializer.serialize_struct("Primitive", 1).ok().unwrap();
        match self {
            Primitive::Number(n) => {
                state.serialize_field("primitive", n);
            }
            Primitive::Bool(b) => {
                state.serialize_field("primitive", b);
            }
            Primitive::Str(s) => {
                state.serialize_field("primitive", s);
            }
        }
        state.end()
    }
}

impl serde::ser::Serialize for Matrix {
    fn serialize<S>(&self, serializer: S) -> Result<<S as Serializer>::Ok, <S as Serializer>::Error> where
        S: Serializer {
        let mut state = serializer.serialize_struct("Primitive", 1).ok().unwrap();
        state.serialize_field("matrix", &self.matrix);
        state.end()
    }
}

