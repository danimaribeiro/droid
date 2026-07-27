// row.h

#ifndef ROW_H
#define ROW_H

#include "ast.h"

#define ROW_ID_SIZE       4
#define ROW_ID_OFFSET     0
#define ROW_NAME_SIZE     28
#define ROW_NAME_OFFSET   (ROW_ID_OFFSET + ROW_ID_SIZE)       // 4
#define ROW_EMAIL_SIZE    28
#define ROW_EMAIL_OFFSET  (ROW_NAME_OFFSET + ROW_NAME_SIZE)   // 32
#define ROW_SIZE          (ROW_ID_SIZE + ROW_NAME_SIZE + ROW_EMAIL_SIZE) // 60

typedef struct {
    int id;
    char name[ROW_NAME_SIZE];
    char email[ROW_EMAIL_SIZE];
} Row;


void serialize_row(Row *row, char *buf);
void deserialize_row(char *buf, Row *row);
void handle_serialize(InsertStatement *stmt);
void handle_deserialize(char *hex_input);

#endif // ROW_H
