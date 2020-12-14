use crate::data::{Data, Primitive, Matrix};
use crate::lexer::TokenType;
use crate::errors::Error;
use crate::symtable::SymTable;
use std::ops::Neg;

#[derive(Debug)]
pub enum EvalResult {
    None,
    Error(Error),
    Single(Data),
    Multiple(Vec<Data>),
    Compound(Vec<EvalResult>),
}

pub trait Evaluates {
    // self destructive evaluation
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult;
}

pub fn compute(node: &dyn Evaluates, table: &mut SymTable, scope: i32) -> Result<Data, Error> {
    let result = node.eval(table, scope);
    return match result {
        EvalResult::Error(err) => {
            Err(err)
        }
        EvalResult::Single(data) => {
            Ok(data)
        }
        EvalResult::Multiple(data) => {
            Ok(data[data.len() - 1].clone())
        }
        EvalResult::Compound(data) => {
            return if let EvalResult::Single(data) = &data[0] {
                Ok(data.clone())
            } else {
                Err(Error::NotImplemented)
            };
        }
        _ => {
            Err(Error::WrongType("no output".to_string()))
        }
    };
}

#[derive(Clone, Debug)]
pub enum Expr {
    Id(Identifier),
    Val(Value),
    Var(Variable),
    Empty(Empty),
    Assign(Box<Assignment>),
    Literal(Literal),
    Block(Box<Block>),
    FnDecl(Box<FnDecl>),
    FnCall(Box<FnCall>),
    If(Box<If>),
    While(Box<While>),
    Unary(Box<Unary>),
    Binary(Box<Binary>),
    Ternary(Box<Ternary>),
    Seq(Box<Sequence<Expr>>),
    Matrix(Box<MatrixExpr>),
}

impl Evaluates for Expr {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        return match self {
            Expr::Id(i) => {
                i.eval(table, scope)
            }
            Expr::Assign(a) => {
                a.eval(table, scope)
            }
            Expr::Literal(l) => {
                l.eval(table, scope)
            }
            Expr::Block(b) => {
                b.eval(table, scope)
            }
            Expr::FnDecl(fd) => { fd.eval(table, scope) }
            Expr::FnCall(fc) => { fc.eval(table, scope) }
            Expr::If(i) => {
                i.eval(table, scope)
            }
            Expr::While(w) => {
                w.eval(table, scope)
            }
            Expr::Unary(u) => { u.eval(table, scope) }
            Expr::Binary(b) => {
                b.eval(table, scope)
            }
            Expr::Ternary(t) => {
                t.eval(table, scope)
            }
            Expr::Var(v) => {
                v.eval(table, scope)
            }
            Expr::Val(v) => {
                v.eval(table, scope)
            }
            Expr::Empty(e) => {
                e.eval(table, scope)
            }
            Expr::Seq(e) => {
                e.eval(table, scope)
            }
            Expr::Matrix(m) => {
                m.eval(table, scope)
            }
        };
    }
}

#[derive(Clone, Debug)]
pub struct Identifier {
    pub id: String
}

impl Evaluates for Identifier {
    fn eval(&self, _: &mut SymTable, _: i32) -> EvalResult {
        return EvalResult::Single(Data::str(self.id.clone()));
    }
}

#[derive(Clone, Debug)]
pub struct Value {
    pub val: Data
}

impl Evaluates for Value {
    fn eval(&self, _: &mut SymTable, _: i32) -> EvalResult {
        return EvalResult::Single(self.val.clone());
    }
}

impl Value {
    pub fn from_str(str: String) -> Expr {
        return Expr::Val(Value { val: Data::str(str) });
    }

    pub fn from_num(num: f64) -> Expr {
        return Expr::Val(Value { val: Data::num(num) });
    }

    pub fn from_bool(b: bool) -> Expr {
        return Expr::Val(Value { val: Data::bool(b) });
    }
}

#[derive(Clone, Debug)]
pub struct Variable {
    pub id: String
}

impl Evaluates for Variable {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let val = table.find_variable(self.id.clone(), scope as usize);
        return match val {
            None => {
                EvalResult::Error(Error::IdentifierNotFound(String::from(format!("`{}` not found", self.id))))
            }
            Some(t) => {
                EvalResult::Single(t.clone())
            }
        };
    }
}

#[derive(Clone, Debug)]
pub struct Assignment {
    pub id: Expr,
    pub expr: Expr,
}

impl Evaluates for Assignment {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let result = compute(&self.expr, table, scope);
        return match result {
            Ok(val) => {
                if let Expr::Var(var) = &self.id {
                    table.assign_variable(var.id.clone(), val.clone(), scope);
                    return EvalResult::Single(val);
                }
                EvalResult::Error(Error::WrongType(String::from("expected a string")))
            }
            Err(err) => {
                EvalResult::Error(err)
            }
        };
    }
}

#[derive(Clone, Debug)]
pub struct Literal {
    pub val: Data
}

impl Evaluates for Literal {
    fn eval(&self, _: &mut SymTable, _: i32) -> EvalResult {
        return EvalResult::Single(self.val.clone());
    }
}

#[derive(Clone, Debug)]
pub struct Block {
    pub children: Vec<Expr>
}

impl Evaluates for Block {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let mut vec = Vec::new();
        for expr in &self.children {
            let result = expr.eval(table, scope);
            if let EvalResult::None = result {} else {
                vec.push(result);
            }
        }
        return EvalResult::Compound(vec);
    }
}

#[derive(Clone, Debug)]
pub struct FnDecl {
    pub id: String,
    pub args: Sequence<Expr>,
    pub func: Block,
}

impl Evaluates for String {
    fn eval(&self, _: &mut SymTable, _: i32) -> EvalResult {
        return EvalResult::Single(Data::str(self.clone()));
    }
}

impl Evaluates for FnDecl {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        table.create_function(self.clone(), scope);
        EvalResult::None
    }
}

impl FnDecl {
    pub fn new() {}
}

#[derive(Clone, Debug)]
pub struct FnCall {
    pub id: String,
    pub args: Sequence<Expr>,
}

impl Evaluates for FnCall {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        return table.execute_function(self, scope);
    }
}

#[derive(Clone, Debug)]
pub struct If {
    pub bool_expr: Expr,
    pub block: Block,
}

impl Evaluates for If {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let eval = compute(&self.bool_expr, table, scope);
        return match eval {
            Ok(data) => {
                if let Data::Primitive(Primitive::Bool(b)) = data {
                    return if b {
                        self.block.eval(table, scope);
                        EvalResult::None
                    } else {
                        EvalResult::None
                    };
                }

                EvalResult::Error(Error::WrongType("expected boolean".to_string()))
            }
            Err(err) => {
                EvalResult::Error(err)
            }
        };
    }
}

#[derive(Clone, Debug)]
pub struct While {
    pub expr: Expr,
    pub block: Block,
}

impl Evaluates for While {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let mut cont = true;
        while cont {
            let expr = compute(&self.expr, table, scope);
            match expr {
                Ok(result) => {
                    if let Data::Primitive(Primitive::Bool(b)) = result {
                        if b {
                            self.block.eval(table, scope);
                        } else {
                            cont = false;
                        }
                    }
                }
                Err(err) => {
                    // if expression couldn't be evaluated, throw exception
                    return EvalResult::Error(err);
                }
            }
        }
        EvalResult::None
    }
}

#[derive(Clone, Debug)]
pub struct Unary {
    pub expr: Expr,
    pub op: TokenType,
}

impl Evaluates for Unary {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let val = compute(&self.expr, table, scope);
        return match val {
            Ok(data) => {
                match self.op {
                    TokenType::Plus => {
                        EvalResult::Single(data)
                    }
                    TokenType::Minus => {
                        EvalResult::Single(data.neg())
                    }
                    TokenType::NotUnary => {
                        if let Data::Primitive(Primitive::Bool(b)) = data {
                            EvalResult::Single(Data::bool(!b))
                        } else {
                            EvalResult::Error(Error::WrongType(String::from("expected a boolean")))
                        }
                    }
                    _ => { EvalResult::Error(Error::NotImplemented) }
                }
            }
            Err(err) => {
                EvalResult::Error(err)
            }
        };
    }
}

#[derive(Clone, Debug)]
pub struct Binary {
    pub left: Expr,
    pub right: Expr,
    pub op: TokenType,
}

impl Evaluates for Binary {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let rl = compute(&self.left, table, scope);
        let rr = compute(&self.right, table, scope);

        let cl = rl.clone();
        let cr = rr.clone();

        // ensure both results are single results
        if let (Ok(data_left), Ok(data_right)) = (rl, rr) {
            use TokenType::*;

            let dl = data_left.clone();
            let dr = data_right.clone();

            let out = match self.op {
                Plus => { data_left + data_right }
                Minus => { data_left - data_right }
                Mul => { data_left * data_right }
                Div => { data_left / data_right }
                Pow => { data_left.pow(data_right) }
                Mod => { Err(Error::NotImplemented) }
                Eq => { Ok(Data::Primitive(Primitive::Bool(data_left == data_right))) }
                NotEq => { Ok(Data::Primitive(Primitive::Bool(data_left != data_right))) }
                RArrow => {
                    Ok(Data::Primitive(Primitive::Bool(data_left > data_right)))
                }
                LArrow => {
                    Ok(Data::Primitive(Primitive::Bool(data_left < data_right)))
                }
                _ => { Err(Error::Whoops) }
            };

            match out {
                Ok(out) => {
                    return EvalResult::Single(out);
                }
                Err(err) => {
                    match err {
                        Error::Whoops => {}
                        _ => { return EvalResult::Error(err); }
                    }
                }
            }


            // check if boolean operator
            if let (Data::Primitive(bl),
                Data::Primitive(br)) = (dl, dr) {
                let out = match self.op {
                    TokenType::AndBool => { bl.bool_and(br) }
                    TokenType::OrBool => { bl.bool_or(br) }
                    TokenType::NotEq => {
                        Ok(Primitive::Bool(bl.ne(&br)))
                    }
                    TokenType::Eq => { Ok(Primitive::Bool(bl.eq(&br))) }
                    TokenType::LessEq => { Ok(bl.le(br)) }
                    TokenType::MoreEq => { Ok(bl.ge(br)) }
                    TokenType::AndBit => { bl.bit_and(br) }
                    TokenType::OrBit => { bl.bit_or(br) }
                    _ => { Err(Error::Whoops) }
                };
                return match out {
                    Ok(out) => {
                        EvalResult::Single(Data::Primitive(out))
                    }
                    Err(err) => {
                        EvalResult::Error(err)
                    }
                };
            }
        } else if let Err(err) = cl {
            return EvalResult::Error(err);
        } else if let Err(err) = cr {
            return EvalResult::Error(err);
        }
        return EvalResult::Error(Error::InternalError);
    }
}

#[derive(Clone, Debug)]
pub struct Ternary {
    pub condition: Expr,
    pub t_expr: Expr,
    pub f_expr: Expr,
}

impl Evaluates for Ternary {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let result = compute(&self.condition, table, scope);
        return match result {
            Ok(data) => {
                if let Data::Primitive(Primitive::Bool(b)) = data {
                    if b {
                        self.t_expr.eval(table, scope)
                    } else {
                        self.f_expr.eval(table, scope)
                    }
                } else {
                    EvalResult::Error(Error::WrongType(String::from("expected boolean")))
                }
            }
            Err(err) => {
                EvalResult::Error(err)
            }
        };
    }
}

#[derive(Clone, Debug)]
pub struct Sequence<T: Evaluates> {
    pub seq: Vec<T>
}

impl<T: Evaluates> Evaluates for Sequence<T> {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let mut result = Vec::new();
        for item in &self.seq {
            if let EvalResult::Single(data) = item.eval(table, scope) {
                result.push(data.clone());
            } else {
                return EvalResult::Error(Error::WrongType(String::from("expected single arg")));
            }
        }

        return EvalResult::Multiple(result);
    }
}

#[derive(Clone, Debug)]
pub struct Empty {}

impl Evaluates for Empty {
    fn eval(&self, _: &mut SymTable, _: i32) -> EvalResult {
        return EvalResult::None;
    }
}

#[derive(Clone, Debug)]
pub struct MatrixExpr {
    pub matrix: Vec<Vec<Expr>>
}

impl Evaluates for MatrixExpr {
    fn eval(&self, table: &mut SymTable, scope: i32) -> EvalResult {
        let r = self.matrix.len();
        let mut c = 0;
        if r > 0 {
            c = self.matrix[0].len();
        }

        let mut matrix = Vec::new();

        for row in &self.matrix {
            if c != row.len() {
                return EvalResult::Error(Error::WrongDimension);
            }
            let mut m_row = Vec::new();
            for el in row {
                let data = el.eval(table, scope);
                if let EvalResult::Single(Data::Primitive(prim)) = data {
                    m_row.push(prim);
                } else {
                    return EvalResult::Error(Error::WrongType(String::from("expected primitive data")));
                }
            }

            matrix.push(m_row);
        }

        return EvalResult::Single(Data::Matrix(Matrix { matrix, dims: (r, c) }));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ast() {
        // generate a function: test(x, y, z)
        /*let decl = FnDecl {
            id: "test".to_string(),
            args: Sequence { seq: vec!["x".to_string(), "y".to_string(), "z".to_string()] },
            func: Block { children: vec![Expr::Literal(Literal { val: Data::num(3f64) })] },
        };
        let mut global = SymTable::new();
        let result = decl.eval(&mut global, 0);
        println!("{:?}", result);

        // create variable expression
        let x = Expr::Literal(Literal { val: Data::num(10f64) });
        let y = Expr::Literal(Literal { val: Data::num(10f64) });
        let z = Expr::Literal(Literal { val: Data::num(10f64) });
        let args = vec![x, y, z];

        let call = FnCall { id: "test".to_string(), args: Sequence { seq: args } };

        let result = call.eval(&mut global, 0);
        println!("{:?}", result);*/
    }

    #[test]
    fn test_add() {
        // create literals
        let x = Expr::Literal(Literal { val: Data::num(3.23) });
        let y = Expr::Literal(Literal { val: Data::num(65.3) });
        let x_plus_y = Expr::Binary(Box::new(Binary { left: x, right: y, op: TokenType::Plus }));

        let mut global = SymTable::new();

        let out = compute(&x_plus_y, &mut global, 0);
        println!("{:?}", out);
    }

    #[test]
    fn test_var_add() {
        let mut global = SymTable::new();

        // create literals
        let assign_x = Expr::Assign(Box::new(Assignment { id: Expr::Var(Variable { id: "x".to_string() }), expr: Expr::Literal(Literal { val: Data::num(3f64) }) }));
        let assign_y = Expr::Assign(Box::new(Assignment { id: Expr::Var(Variable { id: "y".to_string() }), expr: Expr::Literal(Literal { val: Data::num(3f64) }) }));
        assign_x.eval(&mut global, 0);
        assign_y.eval(&mut global, 0);

        let var_x = Expr::Var(Variable { id: "x".to_string() });
        let var_y = Expr::Var(Variable { id: "y".to_string() });
        let x_plus_y = Expr::Binary(Box::new(Binary { left: var_x, right: var_y, op: TokenType::Mul }));


        let out = compute(&x_plus_y, &mut global, 0);
        println!("{:?}", out);
    }
}