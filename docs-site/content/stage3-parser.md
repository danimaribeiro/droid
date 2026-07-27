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

## From Tokens to Structure

The lexer gave us tokens — but tokens alone don't tell us *what the statement means*. The string `INSERT INTO users (id, name) VALUES (1, 'dan')` is just 14 tokens. The **parser** transforms those tokens into a structured tree — an **Abstract Syntax Tree (AST)** — that captures the intent.

## What is Recursive Descent?

It's a parsing technique where **each grammar rule is implemented as a function**. The parser "descends" through the rules by calling functions recursively. It's the same technique used in production compilers (GCC, Clang, V8).

Here's the mental model:

```
Grammar Rule                    →  Parse Function
─────────────────────────────────────────────────
<Statement>  ::= INSERT | SELECT  →  parse_statement()
<InsertStmt> ::= INSERT INTO ...  →  parse_insert()
<SelectStmt> ::= SELECT ... FROM  →  parse_select()
<WhereClause>::= WHERE col = val  →  parse_condition()
```

Each function knows what tokens to expect. If `parse_insert()` calls `consume(KEYWORD_INTO)` and the next token is `FROM`, the parser knows there's a syntax error and reports it.

## Grammar Rules (BNF)

These rules define the valid syntax your parser must accept:

```
<Statement>    ::= <InsertStmt> | <SelectStmt> | <UpdateStmt> | <DeleteStmt>
<InsertStmt>   ::= "INSERT" "INTO" <Identifier> "(" <ColumnList> ")" "VALUES" "(" <ValueList> ")" ";"
<SelectStmt>   ::= "SELECT" <ColumnList> "FROM" <Identifier> [<WhereClause>] ";"
<UpdateStmt>   ::= "UPDATE" <Identifier> "SET" <AssignList> [<WhereClause>] ";"
<DeleteStmt>   ::= "DELETE" "FROM" <Identifier> [<WhereClause>] ";"
<WhereClause>  ::= "WHERE" <Identifier> "=" <Value>
```

You don't need to build a grammar engine — these rules are just a **specification**. You implement them directly as functions.

## Debug Command

The `ast` debug command lets you inspect the parsed tree:

```
droid > ast insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');
Statement: INSERT
Table: users
Columns: [id, name, email]
Values: [1, 'danimar', 'danimar@email.com']
```
