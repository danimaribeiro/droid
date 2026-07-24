use crate::lexer::tokenize;
use crate::parser::parse_statement;
use crate::ast::AstNode;
use crate::lexer::TokenList;


pub fn execute_sql(command: &str) {
    let mut is_tokenize = false;
    let mut is_ast = false;
    let mut sql_command = command;

    if sql_command.starts_with("tokenize ") {
        is_tokenize = true;
        sql_command = sql_command.strip_prefix("tokenize ").unwrap();
    } else if sql_command.starts_with("ast ") {
        is_ast = true;
        sql_command = sql_command.strip_prefix("ast ").unwrap();
    } 

    let tokens: TokenList = tokenize(sql_command);
    let ast: AstNode = parse_statement(&tokens);

    if is_tokenize {
        if tokens.has_error {
            println!("Syntax error in command");
        } else {
            for t in tokens.tokens {
                println!("[{:?} - {}]", t.tk_type, t.token);
            }
        }
    } else if is_ast {
        if ast.has_error {
            println!("Invalid AST in command");
        }   
        println!("[ERROR:00100] AST Parser not implemented yet.");
    } else {
        println!("[ERROR:00100] AST Parser not implemented yet.");
    }
}
