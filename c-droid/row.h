// row.h

#ifndef ROW_H
#define ROW_H

typedef struct {
    int id;
    char name[252];
    char email[252];
} Row;


void serialize_row(Row *row, char *buf);
void deserialize_row(char *buf, Row *row);

#endif // ROW_H
