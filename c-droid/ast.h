#ifndef AST_H
#define AST_H


typedef enum {
    STATEMENT_SELECT,
    STATEMENT_INSERT,
    STATEMENT_UPDATE,
    STATEMENT_DELETE
} StatementType;


typedef enum {
    VALUE_INT,
    VALUE_STRING,
    VALUE_FLOAT
} ValueType;


typedef struct {
    ValueType type;
    union {
        int int_value;
        char *string_value;
        float float_value;
    } data;
} Value;


typedef struct {
    char *column_name;
    char *operator;   
    Value value;
} WhereClause;

typedef struct {
    char *table_name;
    char **column_names;
    int column_count;

    bool has_where;
    WhereClause where;
} SelectStatement;


typedef struct {
    char *table_name;
    char **column_names;
    int column_count;

    Value *values;
    int value_count;
} InsertStatement;


typedef struct {
    char *table_name;
    char **column_names;
    int column_count;

    Value *new_values;
    int set_count;

    bool has_where;
    WhereClause where;
} UpdateStatement;


typedef struct {
    char *table_name;

    bool has_where;
    WhereClause where;
} DeleteStatement;


typedef struct {
    StatementType type;
    bool has_error;
    union {
        SelectStatement select;
        InsertStatement insert;
        UpdateStatement update;
        DeleteStatement delete;
    } statement;
} AST_Node;

#endif