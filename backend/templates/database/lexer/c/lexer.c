#include "lexer.h"

/* TODO: Implement the SQL lexer
 *
 * The tokenize() function should break SQL input into tokens.
 * Each token has a type (keyword, identifier, number, string, symbol)
 * and a string value.
 *
 * Expected output format (printed by repl.c):
 *   [KEYWORD_SELECT - select]
 *   [IDENTIFIER - users]
 *   [SYMBOL - ;]
 */

TokenList tokenize(char *input) {
    // TODO
}

void free_tokens(TokenList *tokens) {
    // TODO
}
