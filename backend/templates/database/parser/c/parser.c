#include "parser.h"

/* TODO: Implement the SQL parser
 *
 * The parse_statement() function should build an AST from tokens.
 * It should handle INSERT, SELECT, UPDATE, and DELETE statements.
 *
 * Expected output format (printed by repl.c):
 *   [AST] Statement: INSERT
 *   [AST] Table: users
 *   [AST] Columns: [id, name, email]
 *   [AST] Values: [1, 'danimar', 'danimar@email.com']
 */

AST_Node parse_statement(TokenList *tokens) {
    // TODO
}

void free_ast_node(AST_Node *node) {
    // TODO
}
