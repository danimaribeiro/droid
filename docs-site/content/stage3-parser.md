---
stage: 3
title: "SQL Parser (Recursive Descent)"
subtitle: "Transforming a token stream into a structured Abstract Syntax Tree"
section: "SQL Statement Compiler"
objective: "Implement a Recursive Descent Parser that consumes the token stream from the lexer and builds an Abstract Syntax Tree (AST) representing the SQL statement's structure."
concepts:
  - "Abstract Syntax Trees (AST) — structured representation of a SQL statement"
  - "Recursive Descent Parsing — one function per grammar rule"
  - "Grammar rules (BNF) — the formal specification of valid SQL syntax"
  - "The consume() / peek() pattern for walking through tokens"
algorithms:
  - title: "How Grammar Rules Become Parse Functions"
    description: "The key insight of Recursive Descent is simple: each grammar rule becomes a function. The grammar is the blueprint, and each function implements one rule of that blueprint by calling consume() to match expected tokens."
    steps:
      - "First, define the grammar rules that describe valid SQL. For example: an INSERT statement is the keyword INSERT, followed by INTO, followed by a table name, followed by parenthesized columns, followed by VALUES, followed by parenthesized values."
      - "For each rule, write a function: parse_insert(), parse_select(), parse_update(), parse_delete(). Each function knows exactly what sequence of tokens to expect."
      - "The entry point is parse_statement(). It peeks at the first token to decide which parse function to call — if the first token is INSERT, it calls parse_insert(). If it's SELECT, it calls parse_select(). This is the 'dispatch' step."
      - "Inside each parse function, you call consume(expected_type) to match tokens one by one. consume() checks if the current token matches what you expect. If it does, it advances the pointer. If not, it reports a syntax error."
      - "For example, parse_insert() would call: consume(KEYWORD_INSERT), consume(KEYWORD_INTO), consume(IDENTIFIER) to get the table name, then consume_symbol('('), then loop to collect column names, then consume_symbol(')'), etc."
      - "As each function successfully consumes tokens, it stores the extracted values (table name, column names, values) into an AST node — the structured output."
  - title: "The consume() and peek() Pattern"
    description: "The parser maintains a cursor (current_index) that tracks which token it's looking at. Two helper functions control this cursor."
    steps:
      - "peek() returns the token at current_index without advancing. Use it to look ahead and decide what to parse next (e.g., 'is the next token a comma? then there's another column')."
      - "consume(expected_type) checks if the current token matches the expected type. If yes, it advances current_index and returns the token. If no, it sets has_error=true and prints a specific error like '[ERROR:00302] Expected IDENTIFIER, found ='."
      - "consume_symbol(expected) works like consume but specifically checks for a symbol token with a matching character (like '(' or ',' or ';')."
      - "This pattern makes the parser very readable: each parse function is just a sequence of consume() calls that mirrors the grammar rule it implements."
  - title: "AST Node Construction"
    description: "The parser builds a tree where the root node carries the statement type and its children carry the extracted data."
    steps:
      - "The root AST_Node contains a type field: STATEMENT_INSERT, STATEMENT_SELECT, STATEMENT_UPDATE, or STATEMENT_DELETE."
      - "For INSERT: the node stores table_name, column_names[] with column_count, and values[] with value_count. Each value is typed (VALUE_INT, VALUE_STRING, VALUE_FLOAT)."
      - "For SELECT: the node stores table_name, column_names[] (or '*' for wildcard), and an optional WhereClause."
      - "For UPDATE: the node stores table_name, assignments[] (column=value pairs), and an optional WhereClause."
      - "For DELETE: the node stores table_name and an optional WhereClause."
      - "A WhereClause contains: column_name, operator (currently only '='), and a comparison value."
checklist:
  - "Create a ParserState struct with token list, current_index, and has_error flag"
  - "Implement peek() to look at the current token without advancing"
  - "Implement consume(expected_type) to match and advance, or report error"
  - "Implement consume_symbol(expected) for matching specific symbols"
  - "Implement parse_statement() as the dispatch entry point (switch on first token)"
  - "Implement parse_insert() — INSERT INTO table (cols) VALUES (vals);"
  - "Implement parse_select() — SELECT cols FROM table [WHERE col = val];"
  - "Implement parse_update() — UPDATE table SET col=val [WHERE col = val];"
  - "Implement parse_delete() — DELETE FROM table [WHERE col = val];"
  - "Handle syntax errors with [ERROR:00302] messages"
  - "Wire the 'ast' debug command to print the parsed AST structure"
---

## From Tokens to Structure (Why Parse?)

The Lexer gave us a linear stream of tokens, but tokens alone carry zero semantic awareness. A sequence like `INSERT INTO users (id) VALUES (1)` is simply an array of 10 individual symbols and strings to the computer. The **SQL Parser** validates whether those tokens appear in a grammatically legal sequence and converts them into a hierarchical representation called an **Abstract Syntax Tree (AST)**.

## Understanding Recursive Descent Parsing

In industrial database engineering, you do not need heavy third-party generator tools like Yacc or Bison. Instead, you will build a clean, blazing-fast **Recursive Descent Parser** from scratch. 

Recursive Descent is a directional parsing technique where **every formal grammar rule in your specification translates directly into a concrete programming function**. The parser "descends" through the syntax hierarchy by having functions call one another recursively. This exact architectural strategy powers the modern parsers inside GCC, Clang, and V8!

### How Grammar Rules Connect to Your Code

Formal SQL syntax is documented using Backus-Naur Form (BNF) grammar rules. Think of a BNF rule as a strict architectural blueprint:

```
<Statement>    ::= <InsertStmt> | <SelectStmt> | <UpdateStmt> | <DeleteStmt>
<InsertStmt>   ::= "INSERT" "INTO" <Table> "(" <Cols> ")" "VALUES" "(" <Vals> ")" ";"
<SelectStmt>   ::= "SELECT" <Cols> "FROM" <Table> [ <WhereClause> ] ";"
<WhereClause>  ::= "WHERE" <Column> "=" <LiteralValue>
```

When implementing your Recursive Descent algorithm, **you literally write one dedicated bare-metal function per BNF rule**:

1. **`parse_statement()`** — Peeks at token 0. If it sees `INSERT`, it routes execution directly to `parse_insert()`. If it sees `SELECT`, it calls `parse_select()`.
2. **`parse_insert()`** — Executes a linear chain of expectations using `consume()`: it demands `KEYWORD_INTO`, saves the `<Table>` identifier, checks for symbol `(`, collects column names, demands `VALUES`, and populates an internal AST `Statement` struct.
3. **`parse_where_clause()`** — If an optional `WHERE` keyword is detected, this function cleanly extracts the predicate column, equality operator, and comparative value literal.

If at any point a `consume(EXPECTED_TYPE)` check encounters an incompatible token (for instance, finding keyword `FROM` where a table identifier was expected), the parser abruptly short-circuits, halts AST evaluation, and outputs an informative syntax error with exact diagnostic codes!

