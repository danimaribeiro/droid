#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "repl.h"

int run_repl(void) {
    char buffer[256];
    while (1) {
        printf("db > ");
        fflush(stdout);
        if (!fgets(buffer, sizeof(buffer), stdin)) {
            break;
        }
        buffer[strcspn(buffer, "\n")] = 0;
        if (strcmp(buffer, ".exit") == 0) {
            break;
        }
        printf("Unrecognized command '%s'.\n", buffer);
    }
    return 0;
}
