#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "utils.c"
#include "engine.c"
#include "table.h"

void parse_command(Table* table, char *command) {
    trim_spaces(command);
    if (strcmp(command, ".exit") == 0) {
        db_close(table);
        printf("exiting.. good bye!\n");
        exit(0);
    } else if (strcmp(command, ".help") == 0) {
        printf("Available commands:\n");
        printf(".exit - Exit the program\n");
        printf(".help - Show this help message\n");
    } else {
        execute_sql(table, command);
    }
}