#include <stdbool.h>
#include "parser.h"
#include "ast.h"
#include "lexer.h"

typedef struct {
    TokenList *tokens;
    int current_index;
    bool has_error;
} ParserState;

Token* peek(ParserState *state) {
    if (state->current_index >= state->tokens->count) {
        return NULL;
    }
    return &state->tokens->tokens[state->current_index];
}

Token* consume(ParserState *state, TokenType expected_type) {
    if (state->current_index >= state->tokens->count) {
        printf("[ERROR:00302] Unexpected end of command\n");
        state->has_error = true;
        return NULL;
    }
    Token *token = &state->tokens->tokens[state->current_index];
    if (token->type != expected_type) {
        printf("[ERROR:00302] Expected token type %d, found '%s'\n", expected_type, token->token);
        state->has_error = true;
        return NULL;
    }
    state->current_index++;
    return token;
}

bool consume_symbol(ParserState *state, const char *expected_symbol) {
    Token *t = peek(state);
    if (t != NULL && t->type == TOKEN_SYMBOL && strcmp(t->token, expected_symbol) == 0) {
        state->current_index++;
        return true;
    }
    printf("[ERROR:00302] Expected '%s' but found '%s'\n", expected_symbol, t ? t->token : "EOF");
    state->has_error = true;
    return false;
}


SelectStatement parse_select(ParserState *state) {
    SelectStatement statement = { .table_name = NULL, .column_names = NULL, .column_count = 0, .has_where = false };
    return statement;
}

UpdateStatement parse_update(ParserState *state) {
    UpdateStatement statement = { .table_name = NULL, .column_names = NULL, .column_count = 0, .new_values = NULL, .set_count = 0, .has_where = false };
    return statement;
}

DeleteStatement parse_delete(ParserState *state) {
    DeleteStatement statement = { .table_name = NULL, .has_where = false };
    return statement;
}

InsertStatement parse_insert(ParserState *state) {
    InsertStatement statement = { 
        .table_name = NULL,
        .column_names = malloc(16 * sizeof(char*)),
        .column_count = 0, 
        .values = malloc(16 * sizeof(Value)),
        .value_count = 0 
    };

    consume(state, TOKEN_KEYWORD_INSERT);
    if (state->has_error) return statement;

    consume(state, TOKEN_KEYWORD_INTO);
    if (state->has_error) return statement;
    
    statement.table_name = strdup(peek(state)->token);
    consume(state, TOKEN_IDENTIFIER);
    if (state->has_error) return statement;

    consume_symbol(state, "(");
    if (state->has_error) return statement;

    statement.column_count = 0;

    while (peek(state) != NULL && peek(state)->type == TOKEN_IDENTIFIER) {
        statement.column_names[statement.column_count] = strdup(peek(state)->token);
        statement.column_count++;
        consume(state, TOKEN_IDENTIFIER);
        if (state->has_error) return statement;
        
        if (peek(state) != NULL && peek(state)->type == TOKEN_SYMBOL && strcmp(peek(state)->token, ",") == 0) {
            consume_symbol(state, ",");
            if (state->has_error) return statement;
        }
    }
    consume_symbol(state, ")");
    if (state->has_error) return statement;

    consume(state, TOKEN_KEYWORD_VALUES);
    if (state->has_error) return statement;

    consume_symbol(state, "(");
    if (state->has_error) return statement;

    statement.value_count = 0;

    Token *t = peek(state); 
    while (t != NULL && (t->type == TOKEN_NUMBER || t->type == TOKEN_STRING)) {
        if (t->type == TOKEN_NUMBER) {
            if (strchr(t->token, '.') != NULL) {
                statement.values[statement.value_count].type = VALUE_FLOAT;
                statement.values[statement.value_count].data.float_value = atof(t->token);
            } else {
                statement.values[statement.value_count].type = VALUE_INT;
                statement.values[statement.value_count].data.int_value = atoi(t->token);
            }
        } else {
            statement.values[statement.value_count].type = VALUE_STRING;
            statement.values[statement.value_count].data.string_value = strdup(t->token);
        }
        statement.value_count++;
        consume(state, t->type);
        if (state->has_error) return statement;

        if (peek(state) != NULL && peek(state)->type == TOKEN_SYMBOL && strcmp(peek(state)->token, ",") == 0) {
            consume_symbol(state, ",");
            if (state->has_error) return statement;
        }
        t = peek(state); 
    }

    if (statement.column_count != statement.value_count) {
        printf("[ERROR:00303] Column count and value count must match\n");
        state->has_error = true;
        return statement;
    }

    consume_symbol(state, ")");
    if (state->has_error) return statement;

    consume_symbol(state, ";");
    if (state->has_error) return statement;

    return statement;

}


AST_Node parse_statement(TokenList *tokens) {

    ParserState state = { .tokens = tokens, .current_index = 0, .has_error = false};
    AST_Node node = { .has_error = false };
    
    Token *first = peek(&state);
    if (first == NULL) {
        node.has_error = true;
        return node;
    }

    switch (first->type) {
        case TOKEN_KEYWORD_SELECT:
            node.type = STATEMENT_SELECT;
            node.statement.select = parse_select(&state);
            break;
        case TOKEN_KEYWORD_INSERT:
            node.type = STATEMENT_INSERT;
            node.statement.insert = parse_insert(&state);
            break;
        case TOKEN_KEYWORD_UPDATE:
            node.type = STATEMENT_UPDATE;
            node.statement.update = parse_update(&state);
            break;
        case TOKEN_KEYWORD_DELETE:
            node.type = STATEMENT_DELETE;
            node.statement.delete = parse_delete(&state);
            break;
        default:
            printf("[ERROR:00301] Unrecognized SQL keyword: %s\n", first->token);
            node.has_error = true;
            break;
    }
    if(state.has_error)
        node.has_error = true;

    return node;
}

void free_ast_node(AST_Node* node) {
    
}