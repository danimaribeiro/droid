#include <iostream>
#include <string.h>
#include "repl.cpp"

int main(int argc, char *argv[]) {

    std::string command;

    if (argc > 1) {
        if (strcmp(argv[1], "-c") == 0) {
            if (argc < 3) {
                std::cout << "[ERROR:00201] Missing argument for -c\n";
                return 1;
            }
            command = argv[2];
            parse_command(command);
            return 0;
        } else {
            std::cout << "[ERROR:00200] Unknown option: " << argv[1] << "\n";
            return 1;
        }
    }
    
    std::cout << "Welcome to droid-c!\n";

    while (1) {
        std::cout << ">";
        if (!std::getline(std::cin, command)) {
            break;
        }
        parse_command(command);
    }
    std::cout << "exiting.. good bye!\n";
    return 0;
}
