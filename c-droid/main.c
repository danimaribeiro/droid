#include <stdio.h>
#include <string.h>
#include "repl.c"
#include "table.h"

int main(int argc, char *argv[]) {
    char command[512];

    Table table = db_open("droid.db");

    if (argc > 1) {
        if (strcmp(argv[1], "-c") == 0) {
            if (argc < 3) {
                printf("[ERROR:00201] Missing argument for -c\n");
                return 1;
            }
            strcpy(command, argv[2]);
            parse_command(&table, command);
            db_close(&table);
            return 0;
        } else {
            printf("[ERROR:00200] Unknown option: %s\n", argv[1]);
            return 1;
        }
    }
    
    printf("Welcome to droid-c!\n");

    while (1) {
        printf(">");
        if (fgets(command, sizeof(command), stdin) == NULL) {
            db_close(&table);
            break;
        }
        // Remove newline at the end
        size_t len = strlen(command);
        if (len > 0 && command[len - 1] == '\n') {
            command[len - 1] = '\0';
        }
        parse_command(&table, command);
    }
    printf("exiting.. good bye!\n");
    return 0;
}
