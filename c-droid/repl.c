#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "utils.c"

void parse_command(char *command) {
    trim_spaces(command);
    if (strcmp(command, ".exit") == 0) {
        printf("exiting.. good bye!\n");
        exit(0);
    } else if (strcmp(command, ".help") == 0) {
        printf("Available commands:\n");
        printf(".exit - Exit the program\n");
        printf(".help - Show this help message\n");
    } else {
        printf("[ERROR:00100] Unknown command: %s\n", command);
    }
}