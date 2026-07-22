#include <string.h>
#include <ctype.h>

void trim_spaces(char *str) {
    int start = 0;
    int end = strlen(str) - 1;

    // Find first non-space character (handles spaces, tabs, newlines)
    while (str[start] && isspace((unsigned char)str[start])) {
        start++;
    }

    // Find last non-space character
    while (end >= start && isspace((unsigned char)str[end])) {
        end--;
    }

    // Shift characters to the front
    int i;
    for (i = start; i <= end; i++) {
        str[i - start] = str[i];
    }
    
    str[i - start] = '\0'; // Null-terminate
}