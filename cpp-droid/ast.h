#ifndef AST_H
#define AST_H

#include <string>
#include <vector>
#include <variant>

enum StatementType {
    STATEMENT_SELECT,
    STATEMENT_INSERT,
    STATEMENT_UPDATE,
    STATEMENT_DELETE
};

enum ValueType {
    VALUE_INT,
    VALUE_STRING,
    VALUE_FLOAT
};

struct Value {
    ValueType type;
    std::variant<int, std::string, float> data;
};

struct WhereClause {
    std::string column_name;
    std::string op; 
    Value value;
};

struct SelectStatement {
    std::string table_name;
    std::vector<std::string> column_names;
    bool has_where = false;
    WhereClause where;
};

struct InsertStatement {
    std::string table_name;
    std::vector<std::string> column_names;
    std::vector<Value> values;
};

struct UpdateStatement {
    std::string table_name;
    std::vector<std::string> column_names;
    std::vector<Value> new_values;
    bool has_where = false;
    WhereClause where;
};

struct DeleteStatement {
    std::string table_name;
    bool has_where = false;
    WhereClause where;
};

struct AST_Node {
    StatementType type;
    bool has_error = false;
    std::variant<SelectStatement, InsertStatement, UpdateStatement, DeleteStatement> statement;
};

#endif