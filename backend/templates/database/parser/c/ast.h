#ifndef AST_H
#define AST_H

#include <stdbool.h>

/* TODO: Define the AST types
 *
 * You'll need types to represent:
 *   - Statement type (SELECT, INSERT, UPDATE, DELETE)
 *   - Values (int, string, float)
 *   - WHERE clauses
 *   - Each statement type (columns, table, values, etc.)
 *   - A top-level AST_Node that wraps them all
 */

typedef struct {
    // Define your AST node structure
    bool has_error;
} AST_Node;

#endif
