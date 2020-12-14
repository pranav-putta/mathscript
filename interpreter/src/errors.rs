use serde::Serializer;
use serde::ser::{SerializeStruct};

#[derive(Debug, Clone)]
pub enum Error {
    WrongDimension,
    WrongType(String),
    WrongNumArguments,
    WrongArgument,
    NotImplemented,
    DivideByZero,
    Whoops,
    IdentifierNotFound(String),
    InternalError,
}

impl serde::ser::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<<S as Serializer>::Ok, <S as Serializer>::Error> where
        S: Serializer {
        let mut s = serializer.serialize_struct("error", 1).ok().unwrap();

        match self {
            Error::WrongDimension => {
                s.serialize_field("error", "wrong dimension");
            }
            Error::WrongType(t) => {
                s.serialize_field("error", t);
            }
            Error::WrongNumArguments => {
                s.serialize_field("error", "wrong number of args");
            }
            Error::WrongArgument => {
                s.serialize_field("error", "wrong argument");
            }
            Error::NotImplemented => {
                s.serialize_field("error", "not implemented");
            }
            Error::DivideByZero => {
                s.serialize_field("error", "divide by zero");
            }
            Error::Whoops => {
                s.serialize_field("error", "whoopsies");
            }
            Error::IdentifierNotFound(i) => {
                s.serialize_field("error", i);
            }
            Error::InternalError => {
                s.serialize_field("error", "internal error");
            }
        }
        s.end()
    }
}