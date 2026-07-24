#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include "engine.h"
#include "ast.h"
#include "lexer.c"
#include "parser.c"

void print_ast(AST_Node root) {
    if (root.has_error) return;

    switch (root.type) {
        case STATEMENT_SELECT:
            printf("Statement: SELECT\n");
            printf("Table: %s\n", root.statement.select.table_name ? root.statement.select.table_name : "");
            printf("Columns: [");
            for (int i = 0; i < root.statement.select.column_count; i++) {
                printf("%s%s", root.statement.select.column_names[i], (i < root.statement.select.column_count - 1) ? ", " : "");
            }
            printf("]\n");
            break;
        case STATEMENT_INSERT:
            printf("Statement: INSERT\n");
            printf("Table: %s\n", root.statement.insert.table_name ? root.statement.insert.table_name : "");
            if (root.statement.insert.column_count > 0) {
                printf("Columns: [");
                for (int i = 0; i < root.statement.insert.column_count; i++) {
                    printf("%s%s", root.statement.insert.column_names[i], (i < root.statement.insert.column_count - 1) ? ", " : "");
                }
                printf("]\n");
            }
            printf("Values: [");
            for (int i = 0; i < root.statement.insert.value_count; i++) {
                Value val = root.statement.insert.values[i];
                if (val.type == VALUE_INT) {
                    printf("%d", val.data.int_value);
                } else if (val.type == VALUE_STRING) {
                    printf("'%s'", val.data.string_value ? val.data.string_value : "");
                } else if (val.type == VALUE_FLOAT) {
                    printf("%g", val.data.float_value);
                }
                if (i < root.statement.insert.value_count - 1) {
                    printf(", ");
                }
            }
            printf("]\n");
            break;
        case STATEMENT_UPDATE:
            printf("Statement: UPDATE\n");
            printf("Table: %s\n", root.statement.update.table_name ? root.statement.update.table_name : "");
            break;
        case STATEMENT_DELETE:
            printf("Statement: DELETE\n");
            printf("Table: %s\n", root.statement.delete.table_name ? root.statement.delete.table_name : "");
            break;
    }
}

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
    AST_Node root = parse_statement(&list);

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
        if (!root.has_error) {
            print_ast(root);
        }
    } else {
        if (!root.has_error) {
            printf("[ERROR:00101] Execution not implemented\n");
        }
    }
}
