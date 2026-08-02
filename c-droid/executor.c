// executor.c

#include "ast.h"
#include "executor.h"
#include "row.h"
#include "btree.c"
#include "table.h"


bool validate_schema_select(SelectStatement *stmt) {
    if (strcmp(stmt->table_name, "users") != 0) {
        printf("[ERROR:00401] Table '%s' does not exist.\n", stmt->table_name);
        return false;
    }
    // Check column names
    for (int i = 0; i < stmt->column_count; i++) {
        if (strcmp(stmt->column_names[i], "*") != 0 &&
            strcmp(stmt->column_names[i], "id") != 0 &&
            strcmp(stmt->column_names[i], "name") != 0 &&
            strcmp(stmt->column_names[i], "email") != 0) {
            printf("[ERROR:00303] Column '%s' does not exist.\n", stmt->column_names[i]);
            return false;
        }
    }
    return true;
}


ExecuteResult execute_select(Table *table, SelectStatement *stmt){
    if (!validate_schema_select(stmt)) {
        return (ExecuteResult){
            .status = EXECUTE_ERROR,
            .affected_rows = 0,
            .message = "Schema validation failed"
        };
    }

    Cursor cursor;
    table_start(table, &cursor);
    
    uint32_t count = 0;
    bool select_all = (stmt->column_count > 0 && strcmp(stmt->column_names[0], "*") == 0);
    if (select_all) {
        printf("id | name | email\n");
    } else {
        for (int i = 0; i < stmt->column_count; i++) {
            printf("%s", stmt->column_names[i]);
            if (i < stmt->column_count - 1) {
                printf(" | ");
            }
        }
        printf("\n");
    }
    while (!cursor.is_eof) {
        Row row = {0};
        void* cell_ptr = cursor_value(&cursor);
        deserialize_row(cell_ptr + 4, &row);

        if (select_all) {
            printf("%u | %s | %s\n", row.id, row.name, row.email);
        } else {
            for (int i = 0; i < stmt->column_count; i++) {
                if (strcmp(stmt->column_names[i], "id") == 0) {
                    printf("%u", row.id);
                } else if (strcmp(stmt->column_names[i], "name") == 0) {
                    printf("%s", row.name);
                } else if (strcmp(stmt->column_names[i], "email") == 0) {
                    printf("%s", row.email);
                }
                
                // Formatação do separador
                if (i < stmt->column_count - 1) printf(" | ");
            }
            printf("\n");
        }

        cursor_advance(&cursor);
        count++;
    }
    
    printf("(%u rows)\n", count);

    return (ExecuteResult){
        .status = EXECUTE_OK,
        .affected_rows = count,
        .message = ""
    };
}

bool validate_schema_insert(InsertStatement *stmt) {
    if (strcmp(stmt->table_name, "users") != 0) {
        printf("[ERROR:00401] Table '%s' does not exist.\n", stmt->table_name);
        return false;
    }
    if (stmt->values[0].type != VALUE_INT) {
        printf("[ERROR:00303] Column 'id' must be an integer.\n");
        return false;
    }
    if (stmt->values[1].type != VALUE_STRING) {
        printf("[ERROR:00303] Column 'name' must be a string.\n");
        return false;
    }
    if (stmt->values[2].type != VALUE_STRING) {
        printf("[ERROR:00303] Column 'email' must be a string.\n");
        return false;
    }
    return true;
}

ExecuteResult execute_insert(Table *table, InsertStatement *stmt){

    if (!validate_schema_insert(stmt)) {
        return (ExecuteResult){
            .status = EXECUTE_ERROR,
            .affected_rows = 0,
            .message = "Schema validation failed"
        };
    }

    Row row = {0};
    row.id = stmt->values[0].data.int_value;
    strncpy(row.name, stmt->values[1].data.string_value, ROW_NAME_SIZE - 1);
    strncpy(row.email, stmt->values[2].data.string_value, ROW_EMAIL_SIZE - 1);

    btree_insert(table, &row);

    return (ExecuteResult){
        .status = EXECUTE_OK,
        .affected_rows = 0,
        .message = "Insert statement executed successfully"
    };
}

ExecuteResult execute_update(Table *table, UpdateStatement *stmt){
    return (ExecuteResult){
        .status = EXECUTE_OK,
        .affected_rows = 0,
        .message = "Update statement executed successfully"
    };
}

ExecuteResult execute_delete(Table *table, DeleteStatement *stmt){
    return (ExecuteResult){
        .status = EXECUTE_OK,
        .affected_rows = 0,
        .message = "Delete statement executed successfully"
    };
}


ExecuteResult execute_statement(Table *table, AST_Node *node) {
    if (node->has_error) {
        return (ExecuteResult){ .status = EXECUTE_ERROR, .affected_rows = 0, .message = "Syntax error" };
    }
    switch (node->type) {
        case STATEMENT_INSERT:
            return execute_insert(table, &node->statement.insert);
            
        case STATEMENT_SELECT:
            return execute_select(table, &node->statement.select);
            
        case STATEMENT_UPDATE:
            return execute_update(table, &node->statement.update);
            
        case STATEMENT_DELETE:
            return execute_delete(table, &node->statement.delete);
            
        default:
            printf("[ERROR:00400] Unknown statement type for execution\n");
            return (ExecuteResult){
                .status = EXECUTE_ERROR,
                .affected_rows = 0,
                .message = "Unknown statement type for execution"
            };
    }
}