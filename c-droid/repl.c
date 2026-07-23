#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "utils.c"
#include "lexer.c"


void parse_command(char *command) {
    trim_spaces(command);
    if (strcmp(command, ".exit") == 0) {
        printf("exiting.. good bye!\n");
        exit(0);
    } else if (strcmp(command, ".help") == 0) {
        printf("Available commands:\n");
        printf(".exit - Exit the program\n");
        printf(".help - Show this help message\n");
    } else {
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

        if (is_tokenize) {
            TokenList list = tokenize(sql);

            if (list.has_error) {
                printf("Syntax error in command\n");
                for (int i = 0; i < list.count; i++) {
                    printf("[%s - %s]\n", token_type_to_string(list.tokens[i].type), list.tokens[i].token);
                }
            } else {
                for (int i = 0; i < list.count; i++) {
                    printf("[%s - %s]\n", token_type_to_string(list.tokens[i].type), list.tokens[i].token);
                }
            }
            free_tokens(&list);
        } else if (is_ast) {
            printf("[ERROR:00100] AST Parser not implemented yet.\n");
        } else {
            printf("[ERROR:00100] AST Parser not implemented yet.\n");
        }
    }
}