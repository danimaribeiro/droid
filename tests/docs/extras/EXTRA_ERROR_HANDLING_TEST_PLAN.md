# Extra Stage: Error Handling Architecture

## Concept
Design a robust error handling strategy that works across the entire codebase — from the lexer to the pager — with clear error propagation, context preservation, and user-friendly messages.

## The Problem Today (Especially in C)
C has no exceptions, no `Result<T, E>`, no `try/catch`. Current approaches:
- Return `-1` and hope the caller checks it (they often don't).
- Use `fprintf(stderr, "[ERROR:00301] ...")` and continue running (error is lost).
- Call `exit(1)` on any error (too aggressive — kills the REPL).

## What It Teaches
- **Error codes as a system**: A well-designed error code scheme tells you WHAT failed, WHERE it failed, and WHY. The 5-digit scheme (`[ERROR:SSCCC]`) encodes the stage and specific error.
- **Error propagation in C**: Using return codes + an error context struct. Every function returns `DroidResult` (success/failure) and sets error details in a thread-local or parameter-passed `ErrorContext`.
- **Error recovery**: The REPL should recover from any error and continue accepting input. Only catastrophic errors (out of memory, disk full) should terminate.
- **Error context chain**: Like PostgreSQL's `errcontext()` — each layer adds context. The final error message shows the full chain: "Parser error at line 1, col 15: expected ')' but found ';'".
- **SQLSTATE codes**: PostgreSQL uses a 5-character error classification (e.g., `42P01` = undefined table). The student implements a simplified version.

## Error Architecture Design

```c
// Error severity levels
typedef enum {
    SEVERITY_INFO,       // Informational (not an error)
    SEVERITY_WARNING,    // Warning (operation completed but something is off)
    SEVERITY_ERROR,      // Error (operation failed, can recover)
    SEVERITY_FATAL,      // Fatal (cannot continue, must exit)
} ErrorSeverity;

// Error context — carries full error information
typedef struct {
    int code;               // 5-digit error code (e.g., 301)
    ErrorSeverity severity;
    char message[256];      // Primary message
    char detail[256];       // Detailed explanation
    char hint[256];         // Suggestion for fixing
    char source_file[64];   // __FILE__
    int source_line;        // __LINE__
    char context[512];      // Accumulated context chain
} ErrorContext;

// Result type — every function returns this
typedef enum { DROID_OK, DROID_ERROR } DroidResult;

// Macros for ergonomic error reporting
#define DROID_RAISE(ctx, code, msg) \
    do { (ctx)->code = (code); \
         snprintf((ctx)->message, sizeof((ctx)->message), "%s", (msg)); \
         (ctx)->source_line = __LINE__; \
         return DROID_ERROR; } while(0)

#define DROID_TRY(expr) \
    do { if ((expr) == DROID_ERROR) return DROID_ERROR; } while(0)
```

## Error Code Scheme

```
[ERROR:SSCCC]
  SS  = Stage/Subsystem (00-33)
  CCC = Specific error code within that subsystem

Subsystem codes:
  00 = General / CLI
  01 = Lexer
  02 = Parser
  03 = Executor
  04 = Serialization
  05 = Pager
  06 = B-Tree
  07 = Catalog / Schema
  08 = Transaction
  09 = WAL
  10 = Planner

Examples:
  [ERROR:02001] Parser: expected keyword, found 'xyz'
  [ERROR:03001] Executor: table 'foo' does not exist
  [ERROR:06003] B-Tree: page 5 is full, cannot insert
  [ERROR:08001] Transaction: no active transaction for COMMIT
```

## Learning Objectives
1. Define a `DroidResult` type and `ErrorContext` struct.
2. Create `DROID_RAISE` and `DROID_TRY` macros for ergonomic error handling in C.
3. Refactor all functions to return `DroidResult` and propagate errors upward.
4. Implement error context accumulation (each layer adds its context string).
5. The REPL catches errors, formats them, and continues — never crashes.
6. Errors include source file/line for debugging (not shown to end users).

## Why This Matters
Poor error handling is the #1 source of bugs in C database engines. This stage forces the student to think systematically about failure modes, which is arguably more important than any SQL feature.
