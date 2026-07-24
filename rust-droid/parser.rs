// parser.rs

use crate::lexer::TokenList;
use crate::ast::AstNode;


pub fn parse_statement(_tokens: &TokenList) -> AstNode {
    AstNode { statement: None, has_error: false }
}