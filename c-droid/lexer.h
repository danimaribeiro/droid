#ifndef LEXER_H
#define LEXER_H


typedef enum {
    TOKEN_KEYWORD_INSERT,
    TOKEN_KEYWORD_UPDATE,
    TOKEN_KEYWORD_DELETE,
    TOKEN_KEYWORD_SELECT,
    TOKEN_KEYWORD_INTO,
    TOKEN_KEYWORD_VALUES,
    TOKEN_KEYWORD_FROM,
    TOKEN_KEYWORD_WHERE,
    TOKEN_IDENTIFIER,
    TOKEN_NUMBER,
    TOKEN_STRING,
    TOKEN_SYMBOL,
    TOKEN_EOF
} TokenType;

typedef struct {
    char *token;
    TokenType type;
} Token;


typedef struct {
    Token *tokens;
    int count;
    bool has_error;
} TokenList;


TokenList tokenize(char *input);
void free_tokens(TokenList *tokens);

#endif
