// row.c

#include "row.h"
#include <string.h>
#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>


void serialize_row(Row *row, char *buf) {
    memcpy(buf + ROW_ID_OFFSET, &(row->id), ROW_ID_SIZE);
    memcpy(buf + ROW_NAME_OFFSET, row->name, ROW_NAME_SIZE);
    memcpy(buf + ROW_EMAIL_OFFSET, row->email, ROW_EMAIL_SIZE);
}

void deserialize_row(char *buf, Row *row) {
    memcpy(&(row->id), buf + ROW_ID_OFFSET, ROW_ID_SIZE);
    memcpy(row->name, buf + ROW_NAME_OFFSET, ROW_NAME_SIZE);
    memcpy(row->email, buf + ROW_EMAIL_OFFSET, ROW_EMAIL_SIZE);
}

void handle_serialize(InsertStatement *stmt) {
    Row row = {0};
    row.id = stmt->values[0].data.int_value;
    strncpy(row.name, stmt->values[1].data.string_value, ROW_NAME_SIZE - 1);
    strncpy(row.email, stmt->values[2].data.string_value, ROW_EMAIL_SIZE - 1);

    char buffer[ROW_SIZE];
    memset(buffer, 0, ROW_SIZE);
    serialize_row(&row, buffer);

    // Print hex dump with spaces
    printf("[SERIALIZE] ");
    for (int i = 0; i < ROW_SIZE; i++) {
        if (i > 0) printf(" ");
        printf("%02x", (unsigned char)buffer[i]);
    }
    printf("\n");
}

void handle_deserialize(char *hex_input) {
    char buffer[ROW_SIZE];
    memset(buffer, 0, ROW_SIZE);

    // Parse hex string into buffer (skip spaces)
    int byte_index = 0;
    char *p = hex_input;
    while (*p && byte_index < ROW_SIZE) {
        // Skip spaces
        while (*p == ' ') p++;
        if (*p == '\0') break;

        // Read two hex chars
        unsigned int byte_val;
        if (sscanf(p, "%2x", &byte_val) != 1) break;
        buffer[byte_index++] = (char)byte_val;
        p += 2;
    }

    Row row = {0};
    deserialize_row(buffer, &row);

    printf("[DESERIALIZE] Field id = %d\n", row.id);
    printf("[DESERIALIZE] Field name = %s\n", row.name);
    printf("[DESERIALIZE] Field email = %s\n", row.email);
}