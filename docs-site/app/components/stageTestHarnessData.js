export const STAGE_HARNESS_DATA = {
  "stage1-repl": {
    title: "Stage 1: Command Loop & REPL Contracts",
    subtitle: "Write an interactive infinite prompt loop that reads user commands, handles dynamic memory allocations, and never crashes on EOF or formatting edge cases.",
    examples: [
      {
        badge: "INTERACTIVE SESSION CONTRACT",
        terminal: `$ ./bin/c-droid
droid > .help
Available commands: .exit, .help
droid > .invalid
[ERROR:00102] Unrecognized meta-command.
droid > select * from users;
[ERROR:00101] SQL execution not implemented yet.
droid > .exit
exiting.. good bye!`
      },
      {
        badge: "ONE-SHOT COMMAND (-c MODE)",
        terminal: `$ ./bin/c-droid -c ".help"
Available commands: .exit, .help
$ echo $?
0

$ ./bin/c-droid -c
Missing SQL argument for -c
$ echo $?
1`
      }
    ],
    samples: {
      c: `// c-droid/repl.c - Stage 1 Introductory Example
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void print_prompt() {
    printf("droid > ");
    fflush(stdout);
}

int main(int argc, char* argv[]) {
    if (argc > 1 && strcmp(argv[1], "-c") == 0) {
        if (argc < 3) {
            fprintf(stderr, "Missing SQL argument for -c\\n");
            return 1;
        }
        printf("[ERROR:00101] SQL execution not implemented yet.\\n");
        return 0;
    }

    char *line = NULL;
    size_t len = 0;
    while (1) {
        print_prompt();
        ssize_t read = getline(&line, &len, stdin);
        if (read == -1) { printf("\\n"); break; }
        if (read > 0 && line[read - 1] == '\\n') line[read - 1] = '\\0';
        if (strlen(line) == 0) continue;

        if (strcmp(line, ".exit") == 0) {
            printf("exiting.. good bye!\\n");
            break;
        } else if (strcmp(line, ".help") == 0) {
            printf("Available commands: .exit, .help\\n");
        } else if (line[0] == '.') {
            printf("[ERROR:00102] Unrecognized meta-command.\\n");
        } else {
            printf("[ERROR:00101] SQL execution not implemented yet.\\n");
        }
    }
    free(line);
    return 0;
}`,
      cpp: `// cpp-droid/main.cpp - Stage 1 Introductory Example
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    if (argc > 1 && std::string(argv[1]) == "-c") {
        if (argc < 3) return 1;
        std::cout << "[ERROR:00101] SQL execution not implemented yet.\\n";
        return 0;
    }
    std::string line;
    while (true) {
        std::cout << "droid > ";
        if (!std::getline(std::cin, line)) break;
        if (line.empty()) continue;
        if (line == ".exit") { std::cout << "exiting.. good bye!\\n"; break; }
        else if (line == ".help") { std::cout << "Available commands: .exit, .help\\n"; }
        else if (line[0] == '.') { std::cout << "[ERROR:00102] Unrecognized meta-command.\\n"; }
        else { std::cout << "[ERROR:00101] SQL execution not implemented yet.\\n"; }
    }
    return 0;
}`,
      rust: `// rust-droid/src/main.rs - Stage 1 Introductory Example
use std::io::{self, Write};

fn main() -> io::Result<()> {
    let mut buffer = String::new();
    loop {
        print!("droid > ");
        io::stdout().flush()?;
        buffer.clear();
        if io::stdin().read_line(&mut buffer)? == 0 { break; }
        let trimmed = buffer.trim();
        if trimmed.is_empty() { continue; }
        match trimmed {
            ".exit" => { println!("exiting.. good bye!"); break; },
            ".help" => println!("Available commands: .exit, .help"),
            s if s.starts_with('.') => println!("[ERROR:00102] Unrecognized meta-command."),
            _ => println!("[ERROR:00101] SQL execution not implemented yet."),
        }
    }
    Ok(())
}`,
      zig: `// zig-droid/src/main.zig - Stage 1 Introductory Example
const std = @import("std");

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    const stdin = std.io.getStdIn().reader();
    var buffer: [4096]u8 = undefined;

    while (true) {
        try stdout.writeAll("droid > ");
        if (try stdin.readUntilDelimiterOrEof(&buffer, '\\n')) |line| {
            if (line.len == 0) continue;
            if (std.mem.eql(u8, line, ".exit")) {
                try stdout.writeAll("exiting.. good bye!\\n");
                break;
            } else if (std.mem.eql(u8, line, ".help")) {
                try stdout.writeAll("Available commands: .exit, .help\\n");
            } else if (line[0] == '.') {
                try stdout.writeAll("[ERROR:00102] Unrecognized meta-command.\\n");
            } else {
                try stdout.writeAll("[ERROR:00101] SQL execution not implemented yet.\\n");
            }
        } else break;
    }
}`
    },
    suiteName: "stage1/repl_tests.py",
    makeCmd: "make test-stage1",
    brokenTestId: "eof-no-crash",
    brokenActual: "Fatal signal 11 (SIGSEGV) at memory address 0x00000000",
    brokenCode: 139,
    bugFailReason: "Failed EOF check: binary crashed with Segmentation Fault when stdin returned EOF signal.",
    tests: [
      { id: "help-command-works", header: "Verifies CLI prints available commands on .help", input: ".help", expected: "Available commands: .exit, .help", exitCode: 0 },
      { id: "exit-command-status", header: "Verifies error reporting then clean terminate on .exit", input: ".foo\\n.exit", expected: "[ERROR:00102] Unrecognized meta-command.\\nexiting.. good bye!", exitCode: 0 },
      { id: "invalid-meta-command-error-code", header: "Rejects unknown dot commands with exact error code", input: ".foo", expected: "[ERROR:00102] Unrecognized meta-command.", exitCode: 0 },
      { id: "empty-line-no-crash", header: "Ignores empty input without crashing or segfaulting", input: "\\n.exit", expected: "droid > droid > exiting.. good bye!", exitCode: 0 },
      { id: "trimmed-help-with-spaces", header: "Trims leading and trailing whitespace properly", input: "   .help   ", expected: "Available commands: .exit, .help", exitCode: 0 },
      { id: "sql-select-unimplemented-error-code", header: "Returns unimp error matching contract regex for SQL statements", input: "select 1;", expected: "[ERROR:00101] SQL execution not implemented yet.", exitCode: 0 },
      { id: "mixed-session-order", header: "Evaluates commands sequentially without buffer corruption", input: ".foo\\nselect 1;\\n.exit", expected: "[ERROR:00102]...\\n[ERROR:00101]...\\nexiting.. good bye!", exitCode: 0 },
      { id: "eof-no-crash", header: "Handles stdin EOF (ctrl+d / empty stream) gracefully", input: "<EOF on stdin>", expected: "<Clean termination with exit code 0>", exitCode: 0 },
      { id: "long-line-no-crash", header: "Buffer safety test against 4096-character string overflow", input: "A x 4096", expected: "<Processed without memory corruption or stack overflow>", exitCode: 0 },
      { id: "cli-c-select-unimplemented-error-code", header: "Executes single SQL command directly via -c flag", input: "./droid -c \"select 1;\"", expected: "[ERROR:00101] SQL execution not implemented yet.", exitCode: 0 },
      { id: "cli-c-missing-argument-fails", header: "Returns non-zero exit code when -c has no arguments", input: "./droid -c", expected: "Missing SQL argument for -c", exitCode: 1 }
    ]
  },

  "stage2-lexer": {
    title: "Stage 2: Lexical Analysis & Tokenizer Contracts",
    subtitle: "Implement a stream character scanner that converts SQL strings into discrete tokens formatted as [TYPE - value] without crashing on unescaped quotes or illegal symbols.",
    examples: [
      {
        badge: "TOKENIZE SELECT STATEMENT CONTRACT",
        terminal: `$ ./bin/c-droid
droid > tokenize select * from users where id = 1;
[KEYWORD_SELECT - select]
[SYMBOL - *]
[KEYWORD_FROM - from]
[IDENTIFIER - users]
[KEYWORD_WHERE - where]
[IDENTIFIER - id]
[SYMBOL - =]
[NUMBER - 1]
[SYMBOL - ;]`
      },
      {
        badge: "ERROR RESILIENCE IN TOKENIZE MODE",
        terminal: `$ ./bin/c-droid
droid > tokenize insert into users values (1, 'danimar
[ERROR:00201] Syntax error in command: missing closing quote
droid > tokenize select # from users;
[ERROR:00202] Syntax error in command: unexpected character '#'
droid > .exit
exiting.. good bye!`
      }
    ],
    samples: {
      c: `// c-droid/lexer.c - Stage 2 Starter Boilerplate
#include <stdio.h>
#include <string.h>
#include <ctype.h>

/*
 * TODO: Implement your character-by-character SQL scanner here.
 * Requirements:
 * 1. Skip leading and inter-token whitespace.
 * 2. Identify SQL reserved keywords (SELECT, FROM, INSERT, VALUES, etc.) vs IDENTIFIER tokens.
 * 3. Extract strings inside single quotes ('...') and check for missing closing quotes ([ERROR:00201]).
 * 4. Scan symbols (*, ;, ,, =, (, )) and numeric literals.
 * 5. Output each discovered token cleanly formatted as [TYPE - value].
 */
void tokenize_sql(const char *input) {
    // YOUR IMPLEMENTATION GOES HERE
    printf("[ERROR:00101] Lexer execution not implemented yet.\\n");
}`,
      cpp: `// cpp-droid/lexer.cpp - Stage 2 Starter Boilerplate
#include <iostream>
#include <string>
#include <cctype>

/*
 * TODO: Implement the character-by-character token generator.
 * Parse keywords, symbols, string literals, and identifiers from std::string& sql.
 * Output each token line-by-line to std::cout formatted as [TYPE - value].
 */
void tokenize_sql(const std::string& sql) {
    // YOUR IMPLEMENTATION GOES HERE
    std::cout << "[ERROR:00101] Lexer execution not implemented yet.\\n";
}`,
      rust: `// rust-droid/src/lexer.rs - Stage 2 Starter Boilerplate

/*
 * TODO: Implement the character stream scanning loop.
 * Walk through input chars, distinguishing between reserved SQL syntax verbs, 
 * identifiers, numeric constants, and symbols. Handle errors without panicking!
 */
pub fn tokenize_sql(input: &str) {
    // YOUR IMPLEMENTATION GOES HERE
    println!("[ERROR:00101] Lexer execution not implemented yet.");
}`,
      zig: `// zig-droid/src/lexer.zig - Stage 2 Starter Boilerplate
const std = @import("std");

/*
 * TODO: Write the character-by-character lexical analysis logic.
 * Format and emit each detected token directly into writer as [TYPE - value].
 */
pub fn tokenizeSql(writer: anytype, sql: []const u8) !void {
    // YOUR IMPLEMENTATION GOES HERE
    try writer.writeAll("[ERROR:00101] Lexer execution not implemented yet.\\n");
}`
    },
    suiteName: "stage2/lexer_tests.py",
    makeCmd: "make test-stage2",
    brokenTestId: "tokenize-missing-quote",
    brokenActual: "[STRING - danimar]\n<Unterminated buffer read beyond string end>",
    brokenCode: 0,
    bugFailReason: "Unterminated string bug: lexer failed to detect missing closing quote and leaked stack bytes without emitting [ERROR:xxxxx].",
    tests: [
      { id: "tokenize-select-valid", header: "Verifies exact bracket output format for SELECT queries", input: "tokenize select * from users;", expected: "[KEYWORD_SELECT - select]\n[SYMBOL - *]\n[KEYWORD_FROM - from]\n[IDENTIFIER - users]\n[SYMBOL - ;]", exitCode: 0 },
      { id: "tokenize-insert-valid", header: "Validates compound tokens in INSERT INTO statements", input: "tokenize insert into users (id, name) values (1, 'dan');", expected: "[KEYWORD_INSERT - insert]\n[KEYWORD_INTO - into]\n[IDENTIFIER - users]\n[SYMBOL - (]\n[IDENTIFIER - id]...", exitCode: 0 },
      { id: "tokenize-update-where", header: "Validates keywords SET, UPDATE and numeric operands", input: "tokenize UPDATE users SET name = 'danimar' WHERE id = 1;", expected: "[KEYWORD_UPDATE - UPDATE]\n[IDENTIFIER - users]\n[KEYWORD_SET - SET]...", exitCode: 0 },
      { id: "tokenize-delete-query", header: "Validates DELETE FROM statements with lowercase syntax", input: "tokenize delete from users where id = 1;", expected: "[KEYWORD_DELETE - delete]\n[KEYWORD_FROM - from]\n[IDENTIFIER - users]...", exitCode: 0 },
      { id: "tokenize-missing-quote", header: "Returns syntax error when encountered unescaped single quote", input: "tokenize insert into users values (1, 'danimar", expected: "Syntax error in command\n[ERROR:00201]", exitCode: 0 },
      { id: "tokenize-invalid-character", header: "Rejects unexpected special characters like # with clean error", input: "tokenize select # from users;", expected: "Syntax error in command\n[ERROR:00202]", exitCode: 0 }
    ]
  },

  "stage3-parser": {
    title: "Stage 3: Recursive Descent Parser & AST Contracts",
    subtitle: "Construct an internal Statement representation by verifying grammar productions and type constraints without generators like Yacc or Bison.",
    examples: [
      {
        badge: "AST TREE EXTRACTION CONTRACT",
        terminal: `$ ./bin/c-droid
droid > ast insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');
Statement: INSERT
Table: users
Values: [1, 'danimar', 'danimar@email.com']

droid > ast select name, email from users where name = 'alice';
Statement: SELECT
Table: users
Columns: [name, email]
Where: name = 'alice'`
      },
      {
        badge: "SYNTAX & TYPE CONSTRAINT VALIDATION",
        terminal: `$ ./bin/c-droid
droid > ast insert into users (id, name, email) values (abc, 'danimar', 'dan@email.com');
[ERROR:00303] Invalid type: expected integer for id, got identifier 'abc'
droid > ast truncate from users;
[ERROR:00301] Unrecognized statement keyword 'truncate'
droid > .exit
exiting.. good bye!`
      }
    ],
    samples: {
      c: `// c-droid/parser.c - Stage 3 Starter Boilerplate
#include <stdio.h>
#include <string.h>

typedef enum { STMT_SELECT, STMT_INSERT, STMT_UPDATE, STMT_DELETE } StmtType;

typedef struct {
    StmtType type;
    char table[32];
    char columns[128];
    char values[256];
    char where_clause[128];
} Statement;

/*
 * TODO: Implement your Recursive Descent syntax validation algorithms.
 * 1. Build consume(expected_type) and peek() helpers over the token stream.
 * 2. Implement one discrete function per BNF grammar rule (parse_insert, parse_select...).
 * 3. Validate column constraint boundaries and output structured AST trees!
 */
int parse_sql(const char *sql, Statement *stmt) {
    // YOUR RECURSIVE DESCENT ENGINE GOES HERE
    printf("[ERROR:00101] SQL parser execution not implemented yet.\\n");
    return -1;
}`,
      cpp: `// cpp-droid/parser.cpp - Stage 3 Starter Boilerplate
#include <iostream>
#include <string>
#include <vector>

struct Statement {
    std::string type;
    std::string table;
    std::vector<std::string> columns;
    std::vector<std::string> values;
};

/*
 * TODO: Implement Recursive Descent parser without third-party generators.
 * Translate grammatical expectations into hierarchical method calls.
 */
bool parse_sql(const std::string& query) {
    // YOUR RECURSIVE DESCENT ENGINE GOES HERE
    std::cout << "[ERROR:00101] SQL parser execution not implemented yet.\\n";
    return false;
}`,
      rust: `// rust-droid/src/parser.rs - Stage 3 Starter Boilerplate
#[derive(Debug)]
pub enum Statement {
    Select { table: String, columns: Vec<String> },
    Insert { table: String, values: Vec<String> },
}

/*
 * TODO: Implement recursive descent rule consumption routines.
 * Return structured AST variants or descriptive formatting/syntax error strings.
 */
pub fn parse_sql(query: &str) -> Result<Statement, String> {
    // YOUR RECURSIVE DESCENT ENGINE GOES HERE
    Err("[ERROR:00101] SQL parser execution not implemented yet.".to_string())
}`,
      zig: `// zig-droid/src/parser.zig - Stage 3 Starter Boilerplate
const std = @import("std");

pub const StatementType = enum { select, insert, update, delete };

/*
 * TODO: Build your consume() and dispatch logic to validate query grammatical correctness.
 */
pub fn parseSql(writer: anytype, query: []const u8) !void {
    // YOUR RECURSIVE DESCENT ENGINE GOES HERE
    try writer.writeAll("[ERROR:00101] SQL parser execution not implemented yet.\\n");
}`
    },
    suiteName: "stage3/parser_tests.py",
    makeCmd: "make test-stage3",
    brokenTestId: "ast-insert-invalid-id",
    brokenActual: "Statement: INSERT\nTable: users\nValues: [abc, 'danimar', 'danimar@email.com']",
    brokenCode: 0,
    bugFailReason: "Missing constraint check: parser allowed non-integer identifier 'abc' into INT column id without returning [ERROR:00303].",
    tests: [
      { id: "ast-insert-valid", header: "Verifies AST construction and values extraction for INSERT", input: "ast insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');", expected: "Statement: INSERT\nTable: users\nValues: [1, 'danimar', 'danimar@email.com']", exitCode: 0 },
      { id: "ast-select-valid", header: "Verifies AST output for simple SELECT wildcard query", input: "ast select * from users;", expected: "Statement: SELECT\nTable: users\nColumns: [*]", exitCode: 0 },
      { id: "ast-select-where", header: "Extracts WHERE condition predicates cleanly", input: "ast select name, email from users where name = 'alice';", expected: "Statement: SELECT\nTable: users\nColumns: [name, email]\nWhere: name = 'alice'", exitCode: 0 },
      { id: "ast-update-where", header: "Validates AST structure for UPDATE commands with predicates", input: "ast update users set name = 'bob' where id = 1;", expected: "Statement: UPDATE\nTable: users\nColumns: [name]\nValues: ['bob']\nWhere: id = 1", exitCode: 0 },
      { id: "ast-delete-where", header: "Validates AST construction for targeted DELETE queries", input: "ast delete from users where id = 1;", expected: "Statement: DELETE\nTable: users\nWhere: id = 1", exitCode: 0 },
      { id: "ast-insert-missing-args", header: "Returns syntax error code when column parity mismatch occurs", input: "ast insert into users (id, name, email) values (1, 'danimar');", expected: "[ERROR:00302]", exitCode: 0 },
      { id: "ast-insert-invalid-id", header: "Rejects string literal or alpha symbol in INT primary key", input: "ast insert into users (id, name, email) values (abc, 'dan', 'dan@email.com');", expected: "[ERROR:00302]", exitCode: 0 },
      { id: "ast-unrecognized-sql", header: "Rejects unknown SQL verbs like truncate with ERROR:00301", input: "ast truncate from users;", expected: "[ERROR:00301]", exitCode: 0 }
    ]
  },

  "stage4-serialization": {
    title: "Stage 4: Row Serialization & Hex Round-Trip Contracts",
    subtitle: "Map logical relational rows (id: int32, name: char[28], email: char[28]) directly to a fixed-size 60-byte binary memory buffer with exact endianness and zero-padding.",
    examples: [
      {
        badge: "SERIALIZE ROW TO HEX BUFFER (60 BYTES)",
        terminal: `$ ./bin/c-droid
droid > serialize insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');
[SERIALIZE] 01 00 00 00 64 61 6e 69 6d 61 72 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 64 61 6e 69 6d 61 72 40 65 6d 61 69 6c 2e 63 6f 6d 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00`
      },
      {
        badge: "DESERIALIZE HEX DUMP & ROUND-TRIP VERIFICATION",
        terminal: `$ ./bin/c-droid
droid > deserialize 01 00 00 00 64 61 6e 69 6d 61 72 00 ...
[DESERIALIZE] Field id = 1
[DESERIALIZE] Field name = danimar
[DESERIALIZE] Field email = danimar@email.com
droid > serialize insert into users (id, name, email) values (0, 'test', 'test@test.com');
[SERIALIZE] 00 00 00 00 74 65 73 74 00 ...`
      }
    ],
    samples: {
      c: `// c-droid/row.c - Stage 4 Starter Boilerplate
#include <stdio.h>
#include <string.h>
#include <stdint.h>

#define ID_SIZE 4
#define NAME_SIZE 28
#define EMAIL_SIZE 28
#define ROW_SIZE (ID_SIZE + NAME_SIZE + EMAIL_SIZE) // 60 Bytes

typedef struct {
    uint32_t id;
    char name[NAME_SIZE];
    char email[EMAIL_SIZE];
} Row;

/*
 * TODO: Implement memory serialization for fixed 60-byte tuples.
 * Remember to memset destination with zeros to guarantee pristine zero-padding on strings!
 */
void serialize_row(const Row* source, void* destination) {
    // YOUR SERIALIZATION MEMCPY PROTOCOL GOES HERE
}

/*
 * TODO: Reconstruct a logical Row struct from a raw binary memory page buffer.
 */
void deserialize_row(const void* source, Row* destination) {
    // YOUR DESERIALIZATION ROUTINE GOES HERE
}`,
      cpp: `// cpp-droid/row.cpp - Stage 4 Starter Boilerplate
#include <iostream>
#include <cstring>
#include <cstdint>

struct Row {
    uint32_t id;
    char name[28];
    char email[28];
};

/*
 * TODO: Map logical Row fields directly into raw consecutive uint8_t memory buffer.
 * Enforce zero padding on string fields so byte-by-byte hex comparisons match deterministically.
 */
void serialize_row(const Row& source, uint8_t* dest) {
    // YOUR IMPLEMENTATION GOES HERE
}

void deserialize_row(const uint8_t* source, Row& dest) {
    // YOUR IMPLEMENTATION GOES HERE
}`,
      rust: `// rust-droid/src/row.rs - Stage 4 Starter Boilerplate
#[repr(C)]
pub struct Row {
    pub id: u32,
    pub name: [u8; 28],
    pub email: [u8; 28],
}

/*
 * TODO: Convert struct fields into contiguous 60-byte slice utilizing little-endian encoding.
 */
pub fn serialize_row(row: &Row, buf: &mut [u8; 60]) {
    // YOUR IMPLEMENTATION GOES HERE
}`,
      zig: `// zig-droid/src/row.zig - Stage 4 Starter Boilerplate
const std = @import("std");

pub const Row = extern struct {
    id: u32,
    name: [28]u8,
    email: [28]u8,
};

/*
 * TODO: Write memory copying instructions to format 60-byte binary row representation.
 */
pub fn serializeRow(row: *const Row, dest: []u8) void {
    // YOUR IMPLEMENTATION GOES HERE
}`
    },
    suiteName: "stage4/serialization_tests.py",
    makeCmd: "make test-stage4",
    brokenTestId: "serialize-empty-strings",
    brokenActual: "[SERIALIZE] 01 00 00 00 5f 78 77 31 00 a1 f9 ... (uninitialized heap garbage)",
    brokenCode: 0,
    bugFailReason: "Memory leak & padding bug: buffer was not zero-initialized with memset before packing, exposing uninitialized memory garbage in char[28] fields.",
    tests: [
      { id: "serialize-valid-insert", header: "Serialize produces correct little-endian hex dump for valid tuple", input: "serialize insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');", expected: "[SERIALIZE] 01 00 00 00 64 61 6e 69 6d 61 72 00...", exitCode: 0 },
      { id: "serialize-zero-id", header: "Verifies correct serialization when primary key id is 0", input: "serialize insert into users (id, name, email) values (0, 'test', 'test@test.com');", expected: "[SERIALIZE] 00 00 00 00 74 65 73 74 00...", exitCode: 0 },
      { id: "serialize-large-id", header: "Verifies 16-bit boundary integer encoding in little-endian (65535)", input: "serialize insert into users (id, name, email) values (65535, 'test', 'test@test.com');", expected: "[SERIALIZE] ff ff 00 00 74 65 73 74 00...", exitCode: 0 },
      { id: "serialize-empty-strings", header: "Verifies clean zero-padding on empty string payloads", input: "serialize insert into users (id, name, email) values (1, '', '');", expected: "[SERIALIZE] 01 00 00 00 00 00 00 00 00 00 00 00...", exitCode: 0 },
      { id: "serialize-syntax-error", header: "Returns clean syntax error when serialize encounters broken SQL", input: "serialize insert into;", expected: "[ERROR:00301]", exitCode: 0 },
      { id: "deserialize-valid", header: "Deserialize reconstructs logical field values cleanly from hex stream", input: "deserialize 01 00 00 00 64 61 6e 69 6d 61 72...", expected: "[DESERIALIZE] Field id = 1\n[DESERIALIZE] Field name = danimar\n[DESERIALIZE] Field email = danimar@email.com", exitCode: 0 },
      { id: "deserialize-round-trip", header: "Verifies 100% data fidelity when serializing then deserializing back", input: "serialize insert... -> deserialize <hex>", expected: "[SERIALIZE] ...\n[DESERIALIZE] Field id = 1...", exitCode: 0 }
    ]
  },

  "stage5-pager": {
    title: "Stage 5: Pager & Buffer Pool Cache Contracts",
    subtitle: "Manage 4KB memory blocks as the core unit of storage I/O, providing an in-memory buffer pool cache to avoid redundant hardware reads.",
    examples: [
      {
        badge: "PAGE ALLOCATION & STATUS CONTRACT",
        terminal: `$ ./bin/c-droid
droid > pager status
[PAGER] Status: total_pages=0 cached=0
droid > pager alloc
[PAGER] Alloc: page 0 (4096 bytes, zeroed)
droid > pager alloc
[PAGER] Alloc: page 1 (4096 bytes, zeroed)
droid > pager status
[PAGER] Status: total_pages=2 cached=2`
      },
      {
        badge: "CACHE HIT VS OUT-OF-BOUNDS ERROR RESILIENCE",
        terminal: `$ ./bin/c-droid
droid > pager get 0
[PAGER] Get page 0: CACHE_HIT
droid > pager get 5
[PAGER] Get page 5: CACHE_MISS (loaded from disk)
droid > pager get 999
[PAGER] Get page 999: ERROR (page out of bounds)
droid > .exit
exiting.. good bye!`
      }
    ],
    samples: {
      c: `// c-droid/pager.c - Stage 5 Starter Boilerplate
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

#define PAGE_SIZE 4096
#define TABLE_MAX_PAGES 100

typedef struct {
    void* pages[TABLE_MAX_PAGES];
    uint32_t num_pages;
} Pager;

/*
 * TODO: Implement the Pager initialization and memory pool management.
 * Requirements:
 * 1. Initialize Pager struct with NULL page pointers and num_pages = 0.
 * 2. In 'pager alloc', allocate a 4096-byte zeroed memory block on the heap and store in pages[num_pages].
 * 3. In 'pager get <N>', check boundaries! If N >= num_pages, print ERROR cleanly without crashing.
 * 4. Report CACHE_HIT if pages[N] != NULL, otherwise handle CACHE_MISS.
 */
void* pager_get_page(Pager* pager, uint32_t page_num) {
    // YOUR PAGER CACHE RETRIEVAL ROUTINE GOES HERE
    printf("[ERROR:00101] Pager get execution not implemented yet.\\n");
    return NULL;
}

uint32_t pager_alloc_page(Pager* pager) {
    // YOUR 4KB PAGE ALLOCATION ROUTINE GOES HERE
    printf("[ERROR:00101] Pager alloc execution not implemented yet.\\n");
    return 0;
}`,
      cpp: `// cpp-droid/pager.cpp - Stage 5 Starter Boilerplate
#include <iostream>
#include <vector>
#include <memory>

constexpr size_t PAGE_SIZE = 4096;
constexpr size_t TABLE_MAX_PAGES = 100;

class Pager {
private:
    std::vector<std::unique_ptr<char[]>> pages;
    size_t total_pages = 0;
public:
    /*
     * TODO: Implement dynamic page allocations and cache lookup methods.
     * Guard strictly against out-of-bounds page requests without throwing unhandled exceptions!
     */
    char* get_page(size_t page_num) {
        // YOUR IMPLEMENTATION GOES HERE
        std::cout << "[ERROR:00101] Pager get not implemented yet.\\n";
        return nullptr;
    }

    size_t alloc_page() {
        // YOUR IMPLEMENTATION GOES HERE
        std::cout << "[ERROR:00101] Pager alloc not implemented yet.\\n";
        return 0;
    }
};`,
      rust: `// rust-droid/src/pager.rs - Stage 5 Starter Boilerplate
pub const PAGE_SIZE: usize = 4096;
pub const TABLE_MAX_PAGES: usize = 100;

pub struct Pager {
    pages: [Option<Box<[u8; PAGE_SIZE]>>; TABLE_MAX_PAGES],
    pub total_pages: usize,
}

impl Pager {
    /*
     * TODO: Implement alloc_page and get_page routines.
     * Enforce strict bounds checks to gracefully emit formatted error messages on out-of-bounds queries.
     */
    pub fn new() -> Self {
        // YOUR INITIALIZATION ROUTINE GOES HERE
        Self {
            pages: [const { None }; TABLE_MAX_PAGES],
            total_pages: 0,
        }
    }

    pub fn alloc_page(&mut self) -> Result<usize, &'static str> {
        // YOUR ALLOCATION LOGIC GOES HERE
        Err("[ERROR:00101] Pager alloc not implemented yet.")
    }
}`,
      zig: `// zig-droid/src/pager.zig - Stage 5 Starter Boilerplate
const std = @import("std");

pub const PAGE_SIZE: usize = 4096;
pub const TABLE_MAX_PAGES: usize = 100;

pub const Pager = struct {
    allocator: std.mem.Allocator,
    pages: [TABLE_MAX_PAGES]?[]u8 = [_]?[]u8{null} ** TABLE_MAX_PAGES,
    total_pages: u32 = 0,

    /*
     * TODO: Implement memory buffer allocation using allocator.alloc(u8, PAGE_SIZE).
     * Verify array indices to block out-of-bounds segmentation faults!
     */
    pub fn allocPage(self: *Pager, writer: anytype) !u32 {
        // YOUR IMPLEMENTATION GOES HERE
        try writer.writeAll("[ERROR:00101] Pager alloc not implemented yet.\\n");
        return 0;
    }
};`
    },
    suiteName: "stage5/pager_tests.py",
    makeCmd: "make test-stage5",
    brokenTestId: "pager-get-out-of-bounds",
    brokenActual: "Fatal signal 11 (SIGSEGV) at memory address 0x00003e70",
    brokenCode: 139,
    bugFailReason: "Segmentation fault: Pager failed to perform bounds checking before reading array index 999, crashing on null memory address.",
    tests: [
      { id: "pager-status-fresh", header: "Checks that 'pager status' on a freshly opened database reports zero pages", input: "pager status\\n.exit", expected: "[PAGER] Status: total_pages=0 cached=0", exitCode: 0 },
      { id: "pager-alloc-first", header: "Checks that 'pager alloc' creates page 0 and outputs allocation confirmation", input: "pager alloc\\n.exit", expected: "[PAGER] Alloc: page 0 (4096 bytes, zeroed)", exitCode: 0 },
      { id: "pager-status-after-alloc", header: "After allocating one page, 'pager status' should show total_pages=1", input: "pager alloc\\npager status\\n.exit", expected: "total_pages=1 after one alloc", exitCode: 0 },
      { id: "pager-get-cached", header: "After allocating page 0, 'pager get 0' should report a cache hit", input: "pager alloc\\npager get 0\\n.exit", expected: "[PAGER] Get page 0: CACHE_HIT", exitCode: 0 },
      { id: "pager-get-out-of-bounds", header: "Requests out of bounds page index 999 and expects clean ERROR output", input: "pager get 999\\n.exit", expected: "[PAGER] Get page 999: ERROR (page out of bounds)", exitCode: 0 },
      { id: "pager-get-unallocated", header: "Requests unallocated page index 5 within capacity bounds and expects ERROR output", input: "pager get 5\\n.exit", expected: "[ERROR:00201] Page number out of bounds", exitCode: 0 },
      { id: "pager-alloc-multiple", header: "After allocating 3 pages in succession, status should show total_pages=3", input: "pager alloc\\npager alloc\\npager alloc\\npager status\\n.exit", expected: "total_pages=3 after three allocs", exitCode: 0 }
    ]
  },
  "stage6-btree-leaf": {
    subtitle: "Implement B+Tree Leaf Node formatting within 4KB memory frames and route relational INSERT execution down to cell buffers.",
    examples: [
      {
        badge: "LEAF NODE INSPECTION",
        terminal: `> insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');
> btree dump 0
[BTREE] Page 0: type=LEAF num_cells=1
[BTREE]   Cell 0: key=1 (60 bytes)`
      },
      {
        badge: "OUT-OF-BOUNDS PROTECTION",
        terminal: `> btree dump 999
[ERROR:00201] Page number out of bounds
> .exit`
      }
    ],
    samples: {
      c: `// c-droid/btree.c - B+Tree Leaf Node & INSERT Execution
#include "btree.h"
#include <stdio.h>

/* 
 * TODO: Define B+Tree Leaf Node header constants and offsets.
 * Remember: In our B+Tree, genuine table tuples reside exclusively inside Leaf Nodes!
 * Node Header: [ Node Type (1 byte) | Is Root (1 byte) | Num Cells (4 bytes) ]
 * Cell Layout: [ Primary Key (4 bytes) | Serialized Row Payload (60 bytes) ] = 64 bytes
 */
void btree_init_leaf_node(void* page) {
    // TODO: Write LEAF node type flag and initialize cell counter to zero
    printf("[ERROR:00101] B+Tree leaf initialization not implemented yet.\\n");
}

void btree_insert(Table* table, Row* row) {
    // TODO: Fetch root leaf page from Pager, locate insertion slot, and write serialized row cell
    printf("[ERROR:00101] B+Tree INSERT execution not implemented yet.\\n");
}

void btree_dump(Table* table, uint32_t page_num) {
    // TODO: Dump node type, total occupancy count, and list primary keys for debugging
    printf("[ERROR:00101] btree dump command not implemented yet.\\n");
}`,
      cpp: `// cpp-droid/src/BTree.cpp - B+Tree Leaf Node Architecture
#include "BTree.hpp"
#include <iostream>

namespace droid {

/*
 * TODO: Implement B+Tree Leaf Node memory mapping.
 * Unlike traditional B-Trees, internal nodes in a B+Tree store no user payloads.
 * All relational table data lives safely inside our 4KB leaf pages!
 */
void BTree::init_leaf_node(void* page_buffer, bool is_root) {
    // TODO: Initialize page header flags and reset cell counter
    std::cout << "[ERROR:00101] B+Tree leaf initialization not implemented yet.\\n";
}

void BTree::insert_tuple(Table& table, const Row& row) {
    // TODO: Serialize row attributes into cell slots inside target leaf node
    std::cout << "[ERROR:00101] B+Tree insert tuple not implemented yet.\\n";
}

} // namespace droid`,
      rust: `// rust-droid/src/btree.rs - B+Tree Leaf Node & Cell Packaging
use std::io::Write;

/// Represents node categorization in our B+Tree engine
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum NodeType {
    Leaf = 0,
    Internal = 1,
}

pub struct BTreeLeaf;

impl BTreeLeaf {
    /// TODO: Stamp fresh memory buffers from the Pager with B+Tree leaf headers.
    /// Keep track of max capacity: (4096 - header_size) / 64 bytes per cell =~ 63 cells!
    pub fn init_node(page_buf: &mut [u8], is_root: bool) -> Result<(), &'static str> {
        // TODO: Write leaf tag and zero out cell count at header offset
        Err("[ERROR:00101] B+Tree leaf initialization not implemented yet.")
    }
}`,
      zig: `// zig-droid/src/btree.zig - B+Tree Leaf Node & Memory Offsets
const std = @import("std");

pub const BTreeNode = struct {
    page_id: u32,
    
    /// TODO: Designate binary offsets for B+Tree Leaf Node Header and Cells.
    /// In a B+Tree, tuples reside strictly in leaf cells: [ Key (u32) | Row Data (60 bytes) ]
    pub fn initLeaf(buffer: []u8, is_root: bool, writer: anytype) !void {
        // YOUR IMPLEMENTATION GOES HERE
        try writer.writeAll("[ERROR:00101] B+Tree leaf initialization not implemented yet.\\n");
    }
};`
    },
    suiteName: "stage6/btree_leaf_tests.py",
    makeCmd: "make test-stage6",
    brokenTestId: "btree-insert-one-dump",
    brokenActual: "[BTREE] Page 0: type=LEAF num_cells=0",
    brokenCode: 0,
    bugFailReason: "Logical flaw: INSERT execution routine copied cell attributes to memory but forgot to increment the leaf header's num_cells counter.",
    tests: [
      { id: "btree-dump-empty", header: "On a fresh database, 'btree dump 0' should show an empty leaf node", input: "btree dump 0\\n.exit", expected: "[BTREE] Page 0: type=LEAF num_cells=0", exitCode: 0 },
      { id: "btree-insert-one-dump", header: "After inserting one row, 'btree dump 0' should show 1 cell with key=1", input: "insert into users values (1, 'danimar', 'danimar@email.com');\\nbtree dump 0\\n.exit", expected: "num_cells=1 with key=1", exitCode: 0 },
      { id: "btree-insert-three-dump", header: "After inserting three rows, 'btree dump 0' should show 3 cells and keys", input: "insert into users values (1, 'a', 'a@t.com');\\ninsert into users values (2, 'b', 'b@t.com');\\ninsert into users values (3, 'c', 'c@t.com');\\nbtree dump 0\\n.exit", expected: "num_cells=3 with all three keys", exitCode: 0 },
      { id: "btree-insert-custom-key", header: "Inserting a row with non-sequential id=42 should appear as key=42 in dump", input: "insert into users values (42, 'test', 'test@test.com');\\nbtree dump 0\\n.exit", expected: "key=42 in dump output", exitCode: 0 },
      { id: "btree-insert-no-error", header: "A valid INSERT should execute cleanly without producing any error codes", input: "insert into users values (1, 'test', 'test@test.com');\\n.exit", expected: "No error codes in output", exitCode: 0 },
      { id: "btree-node-type-leaf", header: "After insert, the root page should report LEAF node type (no splits yet)", input: "insert into users values (1, 'test', 'test@test.com');\\nbtree dump 0\\n.exit", expected: "type=LEAF in dump output", exitCode: 0 },
      { id: "btree-dump-default", header: "Invoking 'btree dump' without arguments should default to dumping root page 0", input: "btree dump\\n.exit", expected: "[BTREE] Page 0: type=LEAF in dump output", exitCode: 0 },
      { id: "btree-dump-out-of-bounds", header: "Invoking 'btree dump 999' on an out-of-bounds page should abort cleanly with ERROR", input: "btree dump 999\\n.exit", expected: "ERROR in output without crashing", exitCode: 0 }
    ]
  },
  "stage7-btree-search": {
    subtitle: "Upgrade leaf nodes with logarithmic binary search, enforce sorted memory shifting on insert, and wire sequential SELECT cursors.",
    examples: [
      {
        badge: "LOGARITHMIC SEARCH & CURSORS",
        terminal: `> btree find 1
[BTREE] Find key=1: FOUND (page=0 cell=0)
[BTREE] Row: id=1 name='danimar' email='danimar@email.com'
> select * from users;
id | name | email
1 | danimar | danimar@email.com
(1 rows)`
      },
      {
        badge: "DUPLICATE KEY VIOLATION",
        terminal: `> insert into users (id, name, email) values (1, 'alice', 'a@test.com');
[ERROR:00601] Duplicate primary key violation: 1`
      }
    ],
    samples: {
      c: `// c-droid/btree_search.c - B+Tree Logarithmic Search & SELECT Cursors
#include "btree.h"
#include <stdio.h>

/*
 * TODO: Implement O(log N) binary search across sorted leaf node cells.
 * Return matching cell coordinate or exact index where incoming key should be inserted.
 */
uint32_t btree_leaf_find(void* page_buf, uint32_t target_key) {
    // TODO: Perform while (left <= right) midpoint calculation and comparisons
    printf("[ERROR:00101] Binary leaf search not implemented yet.\\n");
    return 0;
}

/*
 * TODO: Execute SELECT table scans using Table Cursor abstractions.
 * Iterate sequentially from Cell #0 to end-of-table without exposing bare memory pointers.
 */
void execute_select(Table* table) {
    printf("[ERROR:00101] SELECT cursor scanning not implemented yet.\\n");
}

void btree_find_command(Table* table, uint32_t key) {
    printf("[ERROR:00101] btree find diagnostic command not implemented yet.\\n");
}`,
      cpp: `// cpp-droid/src/BTreeSearch.cpp - B+Tree Search & Sorted Memory Shifting
#include "BTree.hpp"
#include <iostream>

namespace droid {

/*
 * TODO: Maintain sorted cell ordering during out-of-order tuple insertion.
 * Use std::memmove or safe overlapping shifts to vacate insertion slots cleanly.
 */
void BTree::insert_sorted_cell(void* leaf_buf, uint32_t target_idx, const Cell& new_cell) {
    // TODO: Shift existing rightward cells by 64 bytes before depositing new row payload
    std::cout << "[ERROR:00101] B+Tree sorted cell insertion not implemented yet.\\n";
}

void BTree::execute_cursor_scan(Table& table) {
    std::cout << "[ERROR:00101] Table cursor scan not implemented yet.\\n";
}

} // namespace droid`,
      rust: `// rust-droid/src/cursor.rs - B+Tree Cursor & SELECT Query Execution
use std::io::Write;

/// Abstraction representing a sequential record navigator over our B+Tree tables
pub struct TableCursor {
    pub page_id: u32,
    pub cell_index: u32,
    pub end_of_table: bool,
}

impl TableCursor {
    /// TODO: Initialize table cursor pointing directly to Page 0, Cell 0
    pub fn start(root_page: u32) -> Result<Self, &'static str> {
        // YOUR IMPLEMENTATION GOES HERE
        Err("[ERROR:00101] Table cursor initialization not implemented yet.")
    }

    /// TODO: Advance cursor to subsequent cell index or follow leaf sibling pointers
    pub fn advance(&mut self) -> Result<(), &'static str> {
        Err("[ERROR:00101] Cursor advance routine not implemented yet.")
    }
}`,
      zig: `// zig-droid/src/cursor.zig - Table Cursor & Sorted Cell Insertion
const std = @import("std");

pub const TableCursor = struct {
    page_id: u32,
    cell_index: u32,
    end_of_table: bool,
    
    /// TODO: Implement sequential pull-based record scanning for SELECT execution.
    /// Validate that duplicate primary key insertions trigger clean error codes!
    pub fn nextRecord(self: *TableCursor, writer: anytype) !void {
        try writer.writeAll("[ERROR:00101] Table cursor scan not implemented yet.\\n");
    }
};`
    },
    suiteName: "stage7/btree_search_tests.py",
    makeCmd: "make test-stage7",
    brokenTestId: "btree-sorted-insert",
    brokenActual: "Cell 0: key=3, Cell 1: key=1, Cell 2: key=2",
    brokenCode: 0,
    bugFailReason: "Ordering failure: Engine appended cells in raw arrival order (3, 1, 2) instead of shifting memory rightward to enforce sorted numerical key sequence.",
    tests: [
      { id: "btree-find-existing", header: "After inserting row id=1, 'btree find 1' should return FOUND with row data", input: "insert into users values (1, 'danimar', 'd@e.com');\\nbtree find 1\\n.exit", expected: "Find key=1: FOUND with row attributes", exitCode: 0 },
      { id: "btree-find-missing", header: "Searching for non-existent key=99 should cleanly return NOT_FOUND", input: "btree find 99\\n.exit", expected: "Find key=99: NOT_FOUND", exitCode: 0 },
      { id: "btree-sorted-insert", header: "Inserting keys out of order (3, 1, 2) should result in sorted cells (1, 2, 3)", input: "insert into users values (3, 'c', 'c@t.com');\\ninsert into users values (1, 'a', 'a@t.com');\\ninsert into users values (2, 'b', 'b@t.com');\\nbtree dump 0\\n.exit", expected: "Cell 0: key=1, Cell 1: key=2, Cell 2: key=3", exitCode: 0 },
      { id: "btree-find-after-multiple", header: "After inserting 3 rows, each individual key should be FOUND via 'btree find'", input: "insert into users values (1, 'a', 'a@t.com');\\ninsert into users values (2, 'b', 'b@t.com');\\ninsert into users values (3, 'c', 'c@t.com');\\nbtree find 1\\nbtree find 2\\nbtree find 3\\n.exit", expected: "All three keys return FOUND", exitCode: 0 },
      { id: "select-after-insert", header: "After inserting 2 rows, 'select * from users;' should print both rows", input: "insert into users values (1, 'danimar', 'd@e.com');\\ninsert into users values (2, 'alice', 'a@t.com');\\nselect * from users;\\n.exit", expected: "Both inserted row attributes in SELECT output", exitCode: 0 },
      { id: "select-empty-table", header: "On a fresh database, 'select * from users;' should return zero rows cleanly", input: "select * from users;\\n.exit", expected: "(0 rows) without crashing", exitCode: 0 },
      { id: "select-row-count", header: "After inserting 3 rows, the trailing summary should report (3 rows)", input: "insert into users values (1, 'a', 'a@t.com');\\ninsert into users values (2, 'b', 'b@t.com');\\ninsert into users values (3, 'c', 'c@t.com');\\nselect * from users;\\n.exit", expected: "(3 rows) in footer output", exitCode: 0 },
      { id: "select-column-headers", header: "The SELECT output should begin with proper relational column header line", input: "insert into users values (1, 'test', 't@t.com');\\nselect * from users;\\n.exit", expected: "Header: id | name | email", exitCode: 0 },
      { id: "btree-duplicate-key-error", header: "Inserting two rows with identical primary key id=1 should produce an ERROR", input: "insert into users values (1, 'alice', 'a@t.com');\\ninsert into users values (1, 'bob', 'b@t.com');\\n.exit", expected: "Error on duplicate primary key violation", exitCode: 0 }
    ]
  },
  "stage8-btree-split": {
    subtitle: "Implement median leaf node splitting upon capacity overflow (~7 cells per 4KB leaf), promoting separator routing keys up to Internal Nodes.",
    examples: [
      {
        badge: "ROOT SPLIT & TOPOLOGY",
        terminal: `> btree structure
[BTREE] Tree depth: 2
[BTREE] INTERNAL (page=0 keys=[8])
[BTREE]   LEAF (page=1 cells=4 keys=[1,2,3,4])
[BTREE]   LEAF (page=2 cells=4 keys=[8,9,10,11])`
      },
      {
        badge: "SELECT TRAVERSAL AFTER SPLIT",
        terminal: `> select * from users;
id | name | email
... (seamless sequential iteration over leaves)
(8 rows)`
      }
    ],
    samples: {
      c: `// c-droid/btree_split.c - B+Tree Leaf Splits & Internal Routing Nodes
#include "btree.h"
#include <stdio.h>

/*
 * TODO: Implement median B+Tree Leaf Node split protocol upon cell overflow.
 * Remember the B+Tree golden rule: When a leaf overflows and splits in half,
 * keep authentic row payloads strictly inside the sibling leaves and promote only a COPY
 * of the median routing separator key up to the parent Internal Node!
 */
void btree_split_leaf_node(Table* table, uint32_t leaf_page_id) {
    // TODO: Allocate new sibling leaf via Pager, copy upper half of cells, and promote routing key
    printf("[ERROR:00101] B+Tree leaf node splitting not implemented yet.\\n");
}

/*
 * TODO: Initialize Internal Routing Node header layout:
 * [ Node Type = INTERNAL (1 byte) | Num Keys (4 bytes) | Rightmost Child Ptr (4 bytes) ]
 * Routing Array Entries: [ Child Page Pointer (4 bytes) | Separator Key (4 bytes) ] = 8 bytes!
 */
void btree_init_internal_node(void* page_buf) {
    printf("[ERROR:00101] B+Tree internal node initialization not implemented yet.\\n");
}

void btree_structure_command(Table* table) {
    printf("[ERROR:00101] btree structure diagnostic command not implemented yet.\\n");
}`,
      cpp: `// cpp-droid/src/BTreeSplit.cpp - B+Tree Leaf Splitting & Hierarchy Management
#include "BTree.hpp"
#include <iostream>

namespace droid {

/*
 * TODO: Execute root node splitting to grow tree depth vertically from Depth 1 to Depth 2.
 * Allocate Left Child #1 and Right Child #2, then convert Root Page 0 into an INTERNAL routing hub.
 */
void BTree::split_root_node(Table& table) {
    // TODO: Copy root contents to child #1, execute median split to child #2, and promote key to root
    std::cout << "[ERROR:00101] B+Tree root node splitting not implemented yet.\\n";
}

void BTree::print_tree_structure(Table& table) {
    std::cout << "[ERROR:00101] btree structure visualization not implemented yet.\\n";
}

} // namespace droid`,
      rust: `// rust-droid/src/internal_node.rs - B+Tree Internal Routing & Multi-Level Descent
use std::io::Write;

pub struct InternalNode;

impl InternalNode {
    /// TODO: Implement downward hierarchical branching for point evaluations ('btree find').
    /// Compare target key against separator keys; descend via left pointer or Rightmost child pointer.
    pub fn route_child_page(internal_buf: &[u8], target_key: u32) -> Result<u32, &'static str> {
        // YOUR IMPLEMENTATION GOES HERE
        Err("[ERROR:00101] Internal node routing descent not implemented yet.")
    }
}`,
      zig: `// zig-droid/src/split.zig - B+Tree Leaf Splitting & Internal Node Architecture
const std = @import("std");

pub const BTreeSplit = struct {
    /// TODO: Implement median cell balancing when insertions exceed 4KB leaf capacity (~7 cells).
    /// Verify sustained tree balance during massive sequential ingestions (30+ tuples)!
    pub fn splitAndPromote(self: *BTreeSplit, writer: anytype) !void {
        try writer.writeAll("[ERROR:00101] B+Tree leaf split protocol not implemented yet.\\n");
    }
};`
    },
    suiteName: "stage8/btree_split_tests.py",
    makeCmd: "make test-stage8",
    brokenTestId: "btree-insert-order-after-split",
    brokenActual: "id=10, id=9, id=8, ..., id=1",
    brokenCode: 0,
    bugFailReason: "Splitting error: During reverse insertion workload (ids 10 down to 1), engine miscalculated rightmost child pointer transition, breaking ascending SELECT cursor traversal.",
    tests: [
      { id: "btree-no-split-under-limit", header: "Inserting small row quantities under capacity limit keeps tree depth at 1 (single leaf)", input: "insert into users values (1, 'a', 'a@t.com');\\ninsert into users values (2, 'b', 'b@t.com');\\ninsert into users values (3, 'c', 'c@t.com');\\nbtree structure\\n.exit", expected: "Tree depth: 1 with a single LEAF node", exitCode: 0 },
      { id: "btree-split-on-overflow", header: "Inserting 10 rows (exceeding ~7 cell capacity threshold) increases tree depth to 2", input: "insert 10 sequential rows...\\nbtree structure\\n.exit", expected: "Tree depth: 2 after overflow split", exitCode: 0 },
      { id: "btree-internal-node-created", header: "After leaf split, tree structure should report presence of an INTERNAL node", input: "insert 10 sequential rows...\\nbtree structure\\n.exit", expected: "INTERNAL routing node present in structure", exitCode: 0 },
      { id: "btree-split-has-two-leaves", header: "After split, tree hierarchy should list at least two distinct LEAF child branches", input: "insert 10 sequential rows...\\nbtree structure\\n.exit", expected: "At least two LEAF nodes in structure", exitCode: 0 },
      { id: "btree-find-after-split", header: "After overflow split, querying keys 1, 5, and 10 should route correctly and return FOUND", input: "insert 10 sequential rows...\\nbtree find 1\\nbtree find 5\\nbtree find 10\\n.exit", expected: "All queried keys return FOUND across split leaves", exitCode: 0 },
      { id: "btree-select-after-split", header: "After splitting across multiple leaves, SELECT should seamlessly traverse and output (10 rows)", input: "insert 10 sequential rows...\\nselect * from users;\\n.exit", expected: "(10 rows) in output via cursor transition", exitCode: 0 },
      { id: "btree-insert-order-after-split", header: "Inserting 10 rows in reverse order (10 down to 1) should output ascending keys during SELECT", input: "insert 10 rows in reverse order...\\nselect * from users;\\n.exit", expected: "(10 rows) cleanly in ascending key sequence", exitCode: 0 },
      { id: "btree-multi-split", header: "Inserting 30 sequential rows should sustain balance and create 3+ child leaf nodes", input: "insert 30 sequential rows...\\nbtree structure\\n.exit", expected: "INTERNAL and LEAF both present across multi-splits", exitCode: 0 }
    ]
  }
};

