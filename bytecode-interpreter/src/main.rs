mod vm;
mod lexer;
mod compiler;
mod interpreter;

use std::io::{self, Read};


fn main() {
    let mode = 1;

    if mode == 1 {
        repl();
    }
}

fn repl() {
    let mut stdin = io::stdin();
    loop {
        print!(">\t");
        let mut buffer = String::new();
        stdin.read_line(&mut buffer);
    }

}
