---
stage: 2
title: "Lexical Analysis (Tokenizer)"
subtitle: "Turning raw SQL text into a stream of classified tokens"
section: "SQL Statement Compiler"
objective: "Build a Tokenizer (Lexer) that scans a SQL string character by character and produces a list of typed tokens — keywords, identifiers, numbers, strings, and symbols."
concepts:
  - "Lexical Analysis (Tokenizer / Scanner)"
  - "Token types: Keywords, Identifiers, Numbers (integer/float), String literals, Symbols"
  - "Character-by-character scanning with lookahead"
  - "Error detection for invalid characters and unterminated strings"
algorithms:
  - title: "Character-by-Character Token Scanner"
    description: "The tokenizer walks through the input string one character at a time. At each position it decides what kind of token starts here, scans ahead to find the end of that token, classifies it, and moves on."
    steps:
      - "Start at position 0. Skip any whitespace characters."
      - "Check the current character to decide which type of token to scan."
      - "If the character is a letter (a-z, A-Z): scan ahead while characters are alphanumeric or underscore. The resulting word is either a KEYWORD (if it matches SELECT, INSERT, FROM, etc.) or an IDENTIFIER (a column/table name)."
      - "If the character is a digit (0-9): scan ahead while characters are digits or a dot. Classify the result as a NUMBER token (which can be integer or float)."
      - "If the character is a single quote ('): scan ahead until the closing quote is found. Extract the content between quotes as a STRING token. If no closing quote is found, report an error."
      - "If the character is a known symbol (comma, semicolon, parenthesis, asterisk, equals): emit a single-character SYMBOL token."
      - "If the character doesn't match any of the above: emit an error — the character is not valid in SQL."
      - "After emitting the token, advance past it and repeat from step 1 until end of input."
  - title: "Keyword vs Identifier Classification"
    description: "When the scanner finds a word (sequence of letters), it needs to decide if it's a reserved SQL keyword or a user-defined identifier like a table/column name."
    steps:
      - "After scanning a word, convert it to lowercase for comparison."
      - "Check if the word matches any known keyword: SELECT, INSERT, INTO, FROM, WHERE, UPDATE, SET, DELETE, VALUES."
      - "If it matches, classify the token as the specific keyword type (TOKEN_KEYWORD_SELECT, TOKEN_KEYWORD_INSERT, etc.)."
      - "If it doesn't match any keyword, classify it as TOKEN_IDENTIFIER — it's a table name, column name, or other user-defined name."
checklist:
  - "Implement tokenize() function that takes a SQL string and returns a TokenList"
  - "Skip whitespace between tokens"
  - "Scan alphanumeric words and classify as keyword or identifier"
  - "Recognize all SQL keywords: SELECT, INSERT, INTO, FROM, WHERE, UPDATE, SET, DELETE, VALUES"
  - "Scan numeric literals (integers and floats)"
  - "Scan string literals enclosed in single quotes"
  - "Handle symbols: comma, semicolon, parentheses, asterisk, equals"
  - "Report errors for unrecognized characters"
  - "Report errors for unterminated string literals (missing closing quote)"
  - "Wire the 'tokenize' debug command to output tokens in [TYPE - value] format"
---

## What is a Lexer?

A **Lexer** (also called Tokenizer or Scanner) is the first stage of any language processor. It takes a raw string of characters and breaks it into meaningful chunks called **tokens**.

Think of it like reading a sentence in a foreign language: before you can understand the grammar, you first need to identify where each word starts and ends, and what type of word it is (noun, verb, number, punctuation).

For the SQL statement:

```sql
SELECT * FROM users WHERE id = 1;
```

The lexer produces:

```
[KEYWORD - select]
[SYMBOL - *]
[KEYWORD - from]
[IDENTIFIER - users]
[KEYWORD - where]
[IDENTIFIER - id]
[SYMBOL - =]
[NUMBER - 1]
[SYMBOL - ;]
```

Each token has a **type** (KEYWORD, IDENTIFIER, NUMBER, STRING, SYMBOL) and a **value** (the actual text).

## Why Tokenize First?

Without tokenization, every subsequent stage (parser, executor) would have to deal with raw characters — handling whitespace, distinguishing between `SELECT` (keyword) and `selectivity` (identifier), parsing numbers digit by digit. The lexer solves all of this once, so every stage after it works with clean, classified tokens.

## Debug Command

The `tokenize` debug command lets you inspect the token stream for any SQL input:

```
droid > tokenize select * from users;
[KEYWORD - select]
[SYMBOL - *]
[KEYWORD - from]
[IDENTIFIER - users]
[SYMBOL - ;]
```

This is essential for debugging — if the parser produces wrong results, you can check if the lexer is generating the right tokens first.
