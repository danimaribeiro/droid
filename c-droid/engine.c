#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include "engine.h"
#include "ast.h"
#include "lexer.c"
#include "pager.h"
#include "parser.c"
#include "row.c"
#include "executor.c"


void print_value(Value val) {
    if (val.type == VALUE_INT) {
        printf("%d", val.data.int_value);
    } else if (val.type == VALUE_STRING) {
        printf("'%s'", val.data.string_value ? val.data.string_value : "");
    } else if (val.type == VALUE_FLOAT) {
        printf("%g", val.data.float_value);
    }
}

void print_where_clause(WhereClause where) {
    printf("Where: %s %s ", where.column_name ? where.column_name : "", where.operator ? where.operator : "");
    print_value(where.value);
    printf("\n");
}

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
            if (root.statement.select.has_where) {
                print_where_clause(root.statement.select.where);
            }
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
                print_value(root.statement.insert.values[i]);
                if (i < root.statement.insert.value_count - 1) {
                    printf(", ");
                }
            }
            printf("]\n");
            break;
        case STATEMENT_UPDATE:
            printf("Statement: UPDATE\n");
            printf("Table: %s\n", root.statement.update.table_name ? root.statement.update.table_name : "");
            if (root.statement.update.column_count > 0) {
                printf("Columns: [");
                for (int i = 0; i < root.statement.update.column_count; i++) {
                    printf("%s%s", root.statement.update.column_names[i], (i < root.statement.update.column_count - 1) ? ", " : "");
                }
                printf("]\n");
            }
            printf("Values: [");
            for (int i = 0; i < root.statement.update.set_count; i++) {
                print_value(root.statement.update.new_values[i]);
                if (i < root.statement.update.set_count - 1) {
                    printf(", ");
                }
            }
            printf("]\n");
            if (root.statement.update.has_where) {
                print_where_clause(root.statement.update.where);
            }
            break;
        case STATEMENT_DELETE:
            printf("Statement: DELETE\n");
            printf("Table: %s\n", root.statement.delete.table_name ? root.statement.delete.table_name : "");
            if (root.statement.delete.has_where) {
                print_where_clause(root.statement.delete.where);
            }
            break;
    }
}

bool handle_debug_command(Table *table, char *command) {

    // ── Stage 2: Lexer debug ──
    if (strncmp(command, "tokenize ", 9) == 0) {
        char *sql = command + 9;
        TokenList list = tokenize(sql);
        if (list.has_error) {
            printf("Syntax error in command\n");
        } else {
            for (int i = 0; i < list.count; i++) {
                printf("[%s - %s]\n", token_type_to_string(list.tokens[i].type), list.tokens[i].token);
            }
        }
        free_tokens(&list);
        return true;
    }

    // ── Stage 3: Parser debug ──
    if (strncmp(command, "ast ", 4) == 0) {
        char *sql = command + 4;
        TokenList list = tokenize(sql);
        AST_Node root = parse_statement(&list);
        if (!root.has_error) {
            print_ast(root);
        }
        free_tokens(&list);
        return true;
    }

    // ── Stage 4: Serialization debug ──
    if (strncmp(command, "serialize ", 10) == 0) {
        char *sql = command + 10;
        TokenList list = tokenize(sql);
        AST_Node root = parse_statement(&list);
        if (root.has_error || root.type != STATEMENT_INSERT) {
            printf("[ERROR:00400] serialize requires a valid INSERT statement\n");
        } else {
            handle_serialize(&root.statement.insert);
        }
        free_tokens(&list);
        return true;
    }

    // ── Stage 4: Deserialization debug ──
    if (strncmp(command, "deserialize ", 12) == 0) {
        char *hex_input = command + 12;
        handle_deserialize(hex_input);
        return true;
    }

    // Futuro:
    // Stage 5: if (strncmp(command, "pager ", 6) == 0) { ... return true; }
    // Stage 6-8: if (strncmp(command, "btree ", 6) == 0) { ... return true; }

    return false;
}

void execute_sql(Table *table, char *command) {
    if (handle_debug_command(table, command)) {
        return;
    }

    // ── Pipeline normal de execução (Stage 9+) ──
    TokenList list = tokenize(command);
    AST_Node root = parse_statement(&list);
    ExecuteResult result = execute_statement(table, &root);
    printf("%s\n", result.message);
    free_tokens(&list);
}


Table db_open(const char* filename) {
    Table *users = malloc(sizeof(Table));
    users->name = (char*)filename;
    users->pager = malloc(sizeof(Pager));
    users->pager->file_descriptor = open(filename, O_RDWR | O_CREAT, 0644);
    users->pager->file_length = lseek(users->pager->file_descriptor, 0, SEEK_END);
    users->pager->num_pages = users->pager->file_length / PAGE_SIZE;
    users->root_page = 0;
    return *users;
}

void db_close(Table *table) {
    fsync(table->pager->file_descriptor);
    close(table->pager->file_descriptor);
}
