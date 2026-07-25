// executor.h


typedef enum {    
    EXECUTE_OK,
    EXECUTE_ERROR
} ExecuteStatus;


typedef struct {
    ExecuteStatus status;
    int affected_rows;
    char *message;
} ExecuteResult;


ExecuteResult execute_statement(Table *table, AST_Node *node);

