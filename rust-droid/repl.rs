pub fn parse_command(command: &str) {
    let command = command.trim();
    if command == ".exit" {
        println!("exiting.. good bye!");
        std::process::exit(0);
    } else if command == ".help" {
        println!("Available commands:");
        println!(".exit - Exit the program");
        println!(".help - Show this help message");
    } else {
        println!("[ERROR:00100] Unknown command: {}", command);
    }
}