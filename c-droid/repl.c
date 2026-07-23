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
        TokenList list = tokenize(command);

        if (list.has_error) {
            printf("Syntax error in command\n");
        } else {
            for (int i = 0; i < list.count; i++) {
                printf("[%s - %s]\n", token_type_to_string(list.tokens[i].type), list.tokens[i].token);
            }
        }
        free_tokens(&list);
    }
}