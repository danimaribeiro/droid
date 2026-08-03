# Extra Stage: Result Set Architecture

## Concept
Replace direct `printf()` calls in the executor with a structured `ResultSet` abstraction that separates data production from data presentation, supporting both buffered (REPL) and streaming (wire protocol) modes.

## The Problem Today
Currently, the executor does `printf("| %d | %s | %s |", row.id, row.name, row.email)` directly. This has several issues:
- The executor is coupled to the output format (what if we want JSON? CSV? A wire protocol?)
- Errors are printed inline with data, making them hard to distinguish programmatically.
- The REPL, a future client, and a future REST API all need different output formats — but they all share the same executor.

## What It Teaches
- **Separation of concerns**: The executor produces data (rows + metadata). The presentation layer formats it. This is the same pattern used by every production database.
- **Result types**: A query can produce different result types — a row set (SELECT), an affected count (INSERT/UPDATE/DELETE), an error, or a status message (BEGIN/COMMIT). Each needs a distinct representation.
- **Column metadata**: The ResultSet carries column names, types, and widths — not just raw values. This allows the REPL to format pretty tables and the wire protocol to serialize type information.
- **Error context**: Instead of `printf("[ERROR:00301]")`, errors become structured objects with code, message, source location, and optional hint.

## Two Modes: Buffered vs Streaming

This is the key architectural insight. The Volcano model's `Next()` produces rows one at a time. What you do with each row depends on the consumer:

### Buffered Mode (REPL)
```c
// Accumulate all rows, then format as a table
ResultSet *rs = execute_query(plan);
// rs->rows contains ALL rows in memory
format_as_table(rs);   // needs all rows to calculate column widths
free_result(rs);
```

The REPL **must** buffer because pretty-printing a table requires knowing the maximum width of each column before printing the first row.

Memory: O(N) where N = total rows.

### Streaming Mode (Wire Protocol / Client-Server)
```c
// Send each row immediately as it's produced
send_row_description(conn, plan->columns);
while ((row = plan_next(plan)) != NULL) {
    send_data_row(conn, row);    // send ONE row over TCP
    free_row(row);               // immediately free it
}
send_command_complete(conn, row_count);
```

The wire protocol **streams** because:
- The client doesn't need all rows to start displaying them
- Memory usage is O(1) — only one row in memory at a time
- The client can cancel the query mid-stream (`Ctrl+C` in psql)

**This is exactly how PostgreSQL works.** The executor produces a row, the backend serializes it into a DataRow message, sends it down the TCP socket, and calls `Next()` again.

### Architecture

```
                    ┌─────────────┐
                    │   Executor   │
                    │  (Volcano)   │
                    │  Next()→Row  │
                    └──────┬──────┘
                           │ one row at a time
                    ┌──────┴──────┐
                    │  Dispatcher  │
                    └──┬──────┬───┘
                 ┌─────┘      └─────┐
          ┌──────┴──────┐   ┌───────┴───────┐
          │ REPL (buffer)│   │ Wire (stream)  │
          │ collect all  │   │ send each row  │
          │ then format  │   │ immediately    │
          └─────────────┘   └───────────────┘
```

## Result Set Design (Buffered Mode)

```c
typedef enum {
    RESULT_ROWS,        // SELECT: column metadata + row data
    RESULT_OK,          // INSERT/UPDATE/DELETE: affected row count
    RESULT_ERROR,       // Error with code, message, detail
    RESULT_STATUS,      // Status message (BEGIN, COMMIT, etc.)
} ResultType;

typedef struct {
    ResultType type;
    union {
        struct {
            Column *columns;    // column names + types
            int num_columns;
            Row **rows;         // array of row pointers
            int num_rows;
        } row_set;
        struct {
            int affected_rows;
            char *command_tag;  // "INSERT 0 1" like PostgreSQL
        } ok;
        struct {
            int code;           // error code (e.g., 301)
            char *message;      // human-readable message
            char *detail;       // optional detail/hint
        } error;
        struct {
            char *message;      // "BEGIN", "COMMIT", etc.
        } status;
    };
} ResultSet;
```

## Streaming Callback Design (Wire Protocol Mode)

```c
// Instead of returning a ResultSet, the executor calls callbacks:
typedef struct {
    void (*on_row_description)(void *ctx, Column *cols, int num_cols);
    void (*on_data_row)(void *ctx, Row *row);
    void (*on_command_complete)(void *ctx, const char *tag);
    void (*on_error)(void *ctx, int code, const char *message);
    void *ctx;  // opaque context (e.g., TCP connection)
} ResultSink;

// The executor uses the sink instead of printf:
void execute_with_sink(PlanNode *plan, ResultSink *sink) {
    sink->on_row_description(sink->ctx, plan->columns, plan->num_columns);
    Row *row;
    int count = 0;
    while ((row = plan_next(plan)) != NULL) {
        sink->on_data_row(sink->ctx, row);
        count++;
    }
    char tag[64];
    snprintf(tag, sizeof(tag), "SELECT %d", count);
    sink->on_command_complete(sink->ctx, tag);
}
```

This callback pattern lets the same executor work with ANY output:
- **REPL sink**: buffers rows, then pretty-prints a table
- **Wire protocol sink**: sends DataRow messages over TCP
- **JSON sink**: writes JSON objects to a file
- **Test sink**: collects rows for assertion checking

## Learning Objectives
1. Define a `ResultSet` type that can represent rows, OK status, errors, and messages.
2. Define a `ResultSink` callback interface for streaming results.
3. Refactor the executor to use `ResultSink` instead of calling `printf()`.
4. Implement a REPL sink that buffers and pretty-prints tables.
5. Implement a JSON sink for structured output.
6. Ensure all error paths produce structured errors with codes and messages.

## Output Format Examples

**Table format (REPL):**
```
| id | name    | email           |
|----|---------|-----------------|
|  1 | danimar | danimar@e.com   |
|  2 | alice   | alice@e.com     |
(2 rows)
```

**JSON format:**
```json
{
  "type": "rows",
  "columns": [
    {"name": "id", "type": "INT"},
    {"name": "name", "type": "VARCHAR"},
    {"name": "email", "type": "VARCHAR"}
  ],
  "rows": [
    [1, "danimar", "danimar@e.com"],
    [2, "alice", "alice@e.com"]
  ],
  "row_count": 2
}
```

## Why This Matters
This is the foundation for everything else — wire protocol, client/server, REST API, test automation. The buffered vs streaming distinction is fundamental: the REPL needs all rows (for column width calculation), the wire protocol streams them one at a time (for O(1) memory and low latency).
