#ifndef PARSER_H
#define PARSER_H

#include "ast.h"
#include "lexer.h"

AST_Node parse_statement(TokenList *tokens);

void free_ast_node(AST_Node* node);

#endif