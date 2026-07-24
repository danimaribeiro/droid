#ifndef LEXER_H
#define LEXER_H


enum TokenType {
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
};

struct Token {
    std::string token;
    TokenType type;
};


struct TokenList {
    std::vector<Token> tokens;
    bool has_error = false;
};


TokenList tokenize(std::string input);
void free_tokens(TokenList *tokens);

#endif
