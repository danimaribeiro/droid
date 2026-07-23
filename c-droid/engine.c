#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "engine.h"
#include "ast.h"
#include "lexer.c"
#include "parser.c"

void execute_sql(char *command) {
    bool is_tokenize = false;
    bool is_ast = false;
    char *sql = command;

    if (strncmp(command, "tokenize ", 9) == 0) {
        is_tokenize = true;
        sql = command + 9;
    } else if (strncmp(command, "ast ", 4) == 0) {
        is_ast = true;
        sql = command + 4;
    }

    TokenList list = tokenize(sql);
    AST_Node root = parse_statement(list);

    if (is_tokenize) {
        if (list.has_error) {
            printf("Syntax error in command\n");
        } else {
            for (int i = 0; i < list.count; i++) {
                printf("[%s - %s]\n", token_type_to_string(list.tokens[i].type), list.tokens[i].token);
            }
        }
        free_tokens(&list);
    } else if (is_ast) {
        if (root.has_error) {
            printf("Invalid AST in command\n");
        }
        printf("[ERROR:00100] AST Parser not implemented yet.\n");
    } else {
        printf("[ERROR:00100] AST Parser not implemented yet.\n");
    }
}
