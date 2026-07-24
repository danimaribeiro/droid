#include <stdio.h>
#include <string.h>
#include "engine.h"
#include "ast.h"
#include "lexer.cpp"
#include "parser.cpp"

void execute_sql(std::string command) {
    bool is_tokenize = false;
    bool is_ast = false;
    std::string sql = command;

    if (command.rfind("tokenize ", 9) == 0) {
        is_tokenize = true;
        sql = command.substr(9);
    } else if (command.rfind("ast ", 4) == 0) {
        is_ast = true;
        sql = command.substr(4);
    }

    TokenList list = tokenize(sql);
    AST_Node root = parse_statement(list);

    if (is_tokenize) {
        if (list.has_error) {
            std::cout << "Syntax error in command\n";
        } else {
            for (const auto& t : list.tokens) {
                std::cout << "[" << token_type_to_string(t.type) << " - " << t.token << "]\n";
            }
        }
        free_tokens(&list);
    } else if (is_ast) {
        if (root.has_error) {
            std::cout << "Invalid AST in command\n";
        }
        std::cout << "[ERROR:00100] AST Parser not implemented yet.\n";
    } else {
        std::cout << "[ERROR:00100] AST Parser not implemented yet.\n";
    }
}
