#include "lexer.h"
#include <string.h>
#include <stdlib.h>

static Token create_token(char c, TokenType type) {
    Token tk;
    tk.token = malloc(2 * sizeof(char));
    tk.token[0] = c;
    tk.token[1] = '\0';
    tk.type = type;
    return tk;
}


static bool is_symbol(char c) {
    switch(c) {
        case '(': 
        case ')': 
        case ',': 
        case ';':
        case '=':
        case '*':
            return true;
    }
    return false;
}

static TokenType get_keyword_type(char *token) {
    if (strcasecmp(token, "INSERT") == 0) return TOKEN_KEYWORD_INSERT;
    if (strcasecmp(token, "UPDATE") == 0) return TOKEN_KEYWORD_UPDATE;
    if (strcasecmp(token, "DELETE") == 0) return TOKEN_KEYWORD_DELETE;
    if (strcasecmp(token, "SELECT") == 0) return TOKEN_KEYWORD_SELECT;
    if (strcasecmp(token, "INTO") == 0) return TOKEN_KEYWORD_INTO;
    if (strcasecmp(token, "SET") == 0) return TOKEN_KEYWORD_SET;
    if (strcasecmp(token, "VALUES") == 0) return TOKEN_KEYWORD_VALUES;
    if (strcasecmp(token, "FROM") == 0) return TOKEN_KEYWORD_FROM;
    if (strcasecmp(token, "WHERE") == 0) return TOKEN_KEYWORD_WHERE;
    return TOKEN_IDENTIFIER;
}

TokenList tokenize(char *input) {
    TokenList list;
    list.tokens = malloc(100 * sizeof(Token));
    list.count = 0;
    list.has_error = false;

    int i = 0;
    size_t len = strlen(input);
    while (i < len) {
        if (input[i] == ' '){
            i++;
        } else if (is_symbol(input[i])){
            Token tk = create_token(input[i], TOKEN_SYMBOL);
            list.tokens[list.count] = tk;
            list.count++;
            i++;
        } else if(isalpha(input[i])) {
            int start = i;
            while(i < len && (isalnum(input[i]) || input[i] == '_')) {
                i++;
            }
            int length = i - start;
            char *token = strndup(input + start, length);
            Token tk;
            tk.token = token;
            tk.type = get_keyword_type(token);
            list.tokens[list.count] = tk;
            list.count++;
        } else if(isdigit(input[i])) {
            int start = i;
            while(i < len && (isdigit(input[i]) || input[i] == '.')) {
                i++;
            }
            int length = i - start;
            char *token = strndup(input + start, length);
            Token tk;
            tk.token = token;
            tk.type = TOKEN_NUMBER;
            list.tokens[list.count] = tk;
            list.count++;
        } else if(input[i] == '\'') {
            int start = i + 1;
            i++;
            while(i < len && input[i] != '\'') {
                i++;
            }
            if (i == len) {
                printf("[ERROR:00302] Missing closing quote\n");
                list.has_error = true;
                return list;
            }
            int length = i - start;
            char *token = strndup(input + start, length);
            Token tk;
            tk.token = token;
            tk.type = TOKEN_STRING;
            list.tokens[list.count] = tk;
            list.count++;
            i++;
        } else {
            printf("[ERROR:00303] Unexpected character: %c\n", input[i]);
            list.has_error = true;
            break;
        }
    }

    return list;
}


void free_tokens(TokenList *tokens) {
    if (tokens && tokens->tokens != NULL){
        for (int i = 0; i < tokens->count; i++) {
            if (tokens->tokens[i].token != NULL){
                free(tokens->tokens[i].token);
            }
        }
        free(tokens->tokens);
    }
    tokens->count = 0;
}

const char* token_type_to_string(TokenType type) {
    switch (type) {
        case TOKEN_KEYWORD_INSERT: return "KEYWORD_INSERT";
        case TOKEN_KEYWORD_UPDATE: return "KEYWORD_UPDATE";
        case TOKEN_KEYWORD_DELETE: return "KEYWORD_DELETE";
        case TOKEN_KEYWORD_SELECT: return "KEYWORD_SELECT";
        case TOKEN_KEYWORD_INTO:   return "KEYWORD_INTO";
        case TOKEN_KEYWORD_SET:    return "KEYWORD_SET";
        case TOKEN_KEYWORD_VALUES: return "KEYWORD_VALUES";
        case TOKEN_KEYWORD_FROM:   return "KEYWORD_FROM";
        case TOKEN_KEYWORD_WHERE:  return "KEYWORD_WHERE";
        case TOKEN_IDENTIFIER:     return "IDENTIFIER";
        case TOKEN_NUMBER:         return "NUMBER";
        case TOKEN_STRING:         return "STRING";
        case TOKEN_SYMBOL:         return "SYMBOL";
        case TOKEN_EOF:            return "EOF";
        default:                   return "UNKNOWN";
    }
}