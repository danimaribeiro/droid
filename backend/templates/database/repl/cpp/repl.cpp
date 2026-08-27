#include <iostream>
#include <string>
#include "repl.hpp"

int run_repl() {
    std::string input;
    while (true) {
        std::cout << "db > ";
        if (!std::getline(std::cin, input)) break;
        if (input == ".exit") break;
        std::cout << "Unrecognized command '" << input << "'.\n";
    }
    return 0;
}
