// row.c

#include "row.h"
#include <string.h>


void serialize_row(Row *row, char *buf) {
    // 1. Copia o ID para o início do buffer (offset 0)
    memcpy(buf, &(row->id), sizeof(int));
    
    // 2. Copia os 252 bytes do Nome para depois do ID (offset 4)
    memcpy(buf + sizeof(int), row->name, 252);
    
    // 3. Copia os 252 bytes do Email para depois do Nome (offset 4 + 252 = 256)
    memcpy(buf + sizeof(int) + 252, row->email, 252);
}

void deserialize_row(char *buf, Row *row) {
    memcpy(&(row->id), buf, sizeof(int));
    memcpy(row->name, buf + sizeof(int), 252);
    memcpy(row->email, buf + sizeof(int) + 252, 252);
}