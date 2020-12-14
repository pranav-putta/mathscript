use crate::data::{Data, Primitive};
use crate::ast::{EvalResult, Evaluates, FnDecl, FnCall, compute, Expr};
use std::collections::HashMap;
use crate::errors::Error;

type FnInternal = fn(Vec<Data>) -> EvalResult;

#[derive(Clone)]
pub enum Func {
    Defined(FnDecl),
    Internal(FnInternal),
}

#[derive(Clone)]
struct SymStore {
    functions: HashMap<String, Func>,
    variables: HashMap<String, Data>,
}

pub struct SymTable {
    scopes: Vec<SymStore>
}

impl SymStore {
    pub fn new() -> Self {
        SymStore { functions: HashMap::new(), variables: HashMap::new() }
    }
}

impl SymTable {
    pub fn new() -> Self {
        let mut sc = Vec::new();
        sc.push(SymStore::new());
        SymTable { scopes: sc }
    }

    pub fn push(&mut self) {
        self.scopes.push(SymStore::new());
    }

    pub fn pop(&mut self) {
        self.scopes.pop();
    }

    pub fn find_variable(&self, id: String, scope: usize) -> Option<&Data> {
        let mut i: i32 = scope as i32;
        while i >= 0 {
            let store = &self.scopes[i as usize];
            if store.variables.contains_key(id.as_str()) {
                return store.variables.get(id.as_str());
            }

            i -= 1;
        }
        None
    }

    pub fn assign_variable(&mut self, name: String, data: Data, scope: i32) {
        self.scopes[scope as usize].variables.insert(name, data);
    }

    pub fn create_function(&mut self, func: FnDecl, scope: i32) {
        self.scopes[scope as usize].functions.insert(func.id.clone(), Func::Defined(func));
    }

    pub fn execute_function(&mut self, call: &FnCall, scope: i32) -> EvalResult {
        let mut i = scope;
        while i >= 0 {
            let name = &call.id;
            if !self.scopes[i as usize].functions.contains_key(name) {
                i -= 1;
                continue;
            }
            let store = self.scopes[i as usize].clone();
            let func = store.functions.get(name).unwrap();
            let mut input = Vec::new();

            for arg in &call.args.seq {
                let result = compute(arg, self, scope);
                match result {
                    Ok(data) => { input.push(data) }
                    Err(err) => { return EvalResult::Error(err); }
                }
            }


            match func {
                Func::Defined(f) => {
                    if f.args.seq.len() != input.len() {
                        i -= 1;
                        continue;
                    }

                    // populate SymTable
                    self.push();
                    for i in 0..f.args.seq.len() {
                        if let Expr::Var(x) = &f.args.seq[i] {
                            self.assign_variable(x.id.clone(), input[i].clone(), self.scopes.len() as i32 - 1);
                        } else {
                            return EvalResult::Error(Error::WrongType(String::from("expected string")));
                        }
                    }

                    let result = compute(&f.func, self, self.scopes.len() as i32 - 1);
                    self.pop();
                    return EvalResult::Single(result.unwrap());
                }
                Func::Internal(_) => {
                    unimplemented!()
                }
            }
        }

        EvalResult::Error(Error::IdentifierNotFound(format!("{} not found", call.id)))
    }
}
