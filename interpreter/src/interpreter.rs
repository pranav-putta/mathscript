use crate::symtable::SymTable;
use crate::ast::{EvalResult, Evaluates};
use crate::data::Data;
use crate::errors::Error;
use crate::parser::Parser;

fn aggregate_compound(compound: EvalResult) -> Vec<Result<Data, Error>> {
    let mut output = Vec::new();
    return match compound {
        EvalResult::None => {
            output
        }
        EvalResult::Error(err) => {
            vec![Err(err)]
        }
        EvalResult::Single(data) => {
            vec![Ok(data)]
        }
        EvalResult::Multiple(mul) => {
            for m in &mul {
                output.push(Ok(m.clone()));
            }
            output
        }
        EvalResult::Compound(cmp) => {
            for c in cmp {
                let result = aggregate_compound(c);
                for r in result {
                    output.push(r);
                }
            }
            output
        }
    };
}

pub fn interpret(text: &str) -> Vec<Result<Data, Error>> {
    let mut parser = Parser::new(text);
    let expr = parser.parse().unwrap();
    let mut table = SymTable::new();
    let c = expr.eval(&mut table, 0);
    return aggregate_compound(c);
}