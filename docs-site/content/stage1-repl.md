---
stage: 1
title: "Building the CLI Interface"
subtitle: "The Read-Eval-Print Loop"
section: "Command Loop & The REPL"
objective: "Construct an infinite loop that prompts the user for inputs, processes them, and prints the result."
concepts:
  - "Process standard input stream continuously"
  - "Dynamically allocate and grow the input buffer to support variable-length queries"
  - "Graceful terminal exits and resource deallocation"
algorithms:
  - title: "REPL Main Execution Loop"
    description: "The core lifecycle of a CLI-based database interface is an infinite loop that repeats three primary operations: prompt, read, evaluate."
    steps:
      - "Initialize input state: allocate a buffer descriptor with null pointer and zero size."
      - "Print the database prompt command line sign (e.g., \"db > \") to standard output."
      - "Read input line from standard input stream into the dynamically resizing buffer."
      - "Check if the read failed (End of File / EOF). If failed, clean up memory and terminate."
      - "Evaluate the input line to check if it matches database commands."
      - "Print results or feedback, reset the buffer, and loop back to the beginning."
  - title: "Meta-Command Dispatcher"
    description: "Commands starting with a dot (e.g., .exit) are meta-commands handled separately from SQL execution."
    steps:
      - "Extract the first token from the input line."
      - "Verify if the token starts with the '.' character."
      - "If yes: check if it matches '.exit'. If matched, invoke clean-up routines and exit process with code 0."
      - "If the dot command is unrecognized, print 'Unrecognized meta-command' and return to the main prompt loop."
      - "If no dot is present, route the input to the SQL Parser."
checklist:
  - "Create main loop with while(true) or equivalent"
  - "Print prompt 'db > ' (or 'droid > ') before each input"
  - "Read a full line of input from stdin"
  - "Handle .exit meta-command (exit with code 0)"
  - "Handle .help meta-command"
  - "Return error for unrecognized meta-commands with [ERROR:00100]"
  - "Handle EOF (Ctrl+D) gracefully without crashing"
  - "Handle empty lines without crashing"
  - "Support -c flag for single-command CLI mode"
---

## What is a REPL?

A **Read-Eval-Print Loop** (REPL) is the standard interface for interactive database systems. Every major database — SQLite, PostgreSQL, MySQL — starts with a REPL that reads user input, evaluates it, and prints the result.

The REPL is the first thing a user sees when they launch your database, so it needs to be robust: it should never crash on unexpected input, handle edge cases like empty lines and EOF signals, and provide helpful error messages.

## The Two Types of Commands

Your REPL needs to handle two fundamentally different types of input:

1. **Meta-commands** (starting with `.`) — These are internal commands like `.exit` and `.help` that control the REPL itself. They don't go through the SQL pipeline.

2. **SQL statements** — Everything else gets routed to the SQL processing pipeline (tokenizer → parser → executor), which you'll build in the next stages.

## Debug Command

This stage introduces the first debug command pattern:

```
droid > .help
Available commands: .exit, .help
droid > .exit
exiting.. good bye!
```

The `-c` flag allows running a single command without entering the interactive loop:

```bash
./db -c ".help"
```
