use std::env;
use std::io::{self, Write};
mod repl;

fn main() {

    let args: Vec<String> = env::args().collect();
    
    if args.len() > 1 {
        if args[1] == "-c" {
            if args.len() < 3 {
                println!("[ERROR:00201] Missing argument for -c");
                std::process::exit(1);
            }
            let command = &args[2];
            repl::parse_command(command);
            std::process::exit(0);
        } else {
            println!("[ERROR:00200] Unknown option: {}", args[1]);
            std::process::exit(1);
        }
    }
    
    println!("Welcome to droid-rust!");

    loop {
        print!(">");
        
        io::stdout().flush().unwrap();
        let mut command = String::new();
        match std::io::stdin().read_line(&mut command) {
            Ok(0) | Err(_) => break,
            Ok(_) => repl::parse_command(&command),
        }
    }
    println!("exiting.. good bye!");    
}
