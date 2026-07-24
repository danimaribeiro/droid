#include "lexer.h"
#include <string.h>
#include <stdlib.h>

static Token create_token(char c, TokenType type) {
    Token tk;
    tk.token = std::string(1, c);
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

static TokenType get_keyword_type(std::string token) {
    if (strcasecmp(token.c_str(), "INSERT") == 0) return TOKEN_KEYWORD_INSERT;
    if (strcasecmp(token.c_str(), "UPDATE") == 0) return TOKEN_KEYWORD_UPDATE;
    if (strcasecmp(token.c_str(), "DELETE") == 0) return TOKEN_KEYWORD_DELETE;
    if (strcasecmp(token.c_str(), "SELECT") == 0) return TOKEN_KEYWORD_SELECT;
    if (strcasecmp(token.c_str(), "INTO") == 0) return TOKEN_KEYWORD_INTO;
    if (strcasecmp(token.c_str(), "VALUES") == 0) return TOKEN_KEYWORD_VALUES;
    if (strcasecmp(token.c_str(), "FROM") == 0) return TOKEN_KEYWORD_FROM;
    if (strcasecmp(token.c_str(), "WHERE") == 0) return TOKEN_KEYWORD_WHERE;
    return TOKEN_IDENTIFIER;
}

TokenList tokenize(std::string input) {
    TokenList list;
    list.tokens = std::vector<Token>();
    list.has_error = false;

    int i = 0;
    size_t len = input.length();
    while (i < len) {
        if (input[i] == ' '){
            i++;
        } else if (is_symbol(input[i])){
            Token tk = create_token(input[i], TOKEN_SYMBOL);
            list.tokens.push_back(tk);
            i++;
        } else if(isalpha(input[i])) {
            int start = i;
            while(i < len && (isalnum(input[i]) || input[i] == '_')) {
                i++;
            }
            int length = i - start;
            Token tk;
            tk.token = input.substr(start, length);
            tk.type = get_keyword_type(tk.token);
            list.tokens.push_back(tk);
        } else if(isdigit(input[i])) {
            int start = i;
            while(i < len && (isdigit(input[i]) || input[i] == '.')) {
                i++;
            }
            int length = i - start;
            Token tk;
            tk.token = input.substr(start, length);
            tk.type = TOKEN_NUMBER;
            list.tokens.push_back(tk);
        } else if(input[i] == '"') {
            int start = i;
            i++;
            while(i < len && input[i] != '"') {
                i++;
            }
            if (i == len) {
                printf("[ERROR:00302] Missing closing quote\n");
                list.has_error = true;
                return list;
            }
            int length = i - start;
            Token tk;
            tk.token = input.substr(start, length);
            tk.type = TOKEN_STRING;
            list.tokens.push_back(tk);
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
    if (tokens != nullptr) {
        // O std::vector e a std::string limpam a própria memória automaticamente!
        // Chamar .clear() esvazia o vetor e deleta todas as strings lá dentro.
        tokens->tokens.clear(); 
        tokens->has_error = false;
    }
}

const std::string token_type_to_string(TokenType type) {
    switch (type) {
        case TOKEN_KEYWORD_INSERT: return "KEYWORD_INSERT";
        case TOKEN_KEYWORD_UPDATE: return "KEYWORD_UPDATE";
        case TOKEN_KEYWORD_DELETE: return "KEYWORD_DELETE";
        case TOKEN_KEYWORD_SELECT: return "KEYWORD_SELECT";
        case TOKEN_KEYWORD_INTO:   return "KEYWORD_INTO";
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