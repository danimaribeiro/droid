#include <stdio.h>
#include <string>
#include <cstdlib>
#include <iostream>
#include "engine.cpp"
#include "utils.cpp"

void parse_command(std::string &command) {
    trim(command);
    if (command == ".exit") {
        std::cout << "exiting.. good bye!\n";
        exit(0);
    } else if (command == ".help") {
        std::cout << "Available commands:\n";
        std::cout << ".exit - Exit the program\n";
        std::cout << ".help - Show this help message\n";
    } else {
        execute_sql(command);
    }
}