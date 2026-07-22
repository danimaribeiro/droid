#include <iostream>
#include <string>

// Trims leading whitespace
void ltrim(std::string &s) {
    s.erase(0, s.find_first_not_of(" \t\n\r\f\v"));
}

// Trims trailing whitespace
void rtrim(std::string &s) {
    size_t end = s.find_last_not_of(" \t\n\r\f\v");
    if (end != std::string::npos) {
        s.erase(end + 1);
    } else {
        s.clear(); // String is entirely whitespace
    }
}

// Trims both ends
void trim(std::string &s) {
    ltrim(s);
    rtrim(s);
}