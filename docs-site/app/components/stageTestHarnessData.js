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
  }
};

