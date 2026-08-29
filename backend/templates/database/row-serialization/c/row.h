#ifndef ROW_H
#define ROW_H

#include "ast.h"

#define ROW_SIZE 60

/* TODO: Define the Row struct and serialization layout
 *
 * Fixed row layout: id (4 bytes) + name (28 bytes) + email (28 bytes) = 60 bytes
 */

typedef struct {
    // Define your row fields
} Row;

void serialize_row(Row *row, char *buf);
void deserialize_row(char *buf, Row *row);
void handle_serialize(InsertStatement *stmt);
void handle_deserialize(char *hex_input);

#endif
