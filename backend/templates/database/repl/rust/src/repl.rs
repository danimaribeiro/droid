use std::io::{self, Write};

pub fn run_repl() {
    let stdin = io::stdin();
    let mut input = String::new();
    loop {
        print!("db > ");
        io::stdout().flush().unwrap();
        input.clear();
        if stdin.read_line(&mut input).unwrap() == 0 {
            break;
        }
        let trimmed = input.trim_end();
        if trimmed == ".exit" {
            break;
        }
        println!("Unrecognized command '{}'.", trimmed);
    }
}
