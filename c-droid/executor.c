// executor.c

#include "ast.h"
#include "executor.h"
#include "row.h"
#include "btree.c"
#include "table.h"


ExecuteResult execute_select(Table *table, SelectStatement *stmt){
    return (ExecuteResult){
        .status = EXECUTE_OK,
        .affected_rows = 0,
        .message = "Select statement executed successfully"
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

    char *buffer = malloc(ROW_SIZE);
    memset(buffer, 0, ROW_SIZE);
    serialize_row(&row, buffer);

    btree_insert_old(table, row.id, buffer);

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