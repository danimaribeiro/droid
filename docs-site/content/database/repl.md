---
stage: 1
title: "Building the CLI Interface"
subtitle: "The Read-Eval-Print Loop"
youtubeId: "Or3MMzZMpVY"
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

A **Read-Eval-Print Loop** (REPL) is the interactive Command-Line Interface for relational databases. Whether you invoke `sqlite3`, `psql`, or `mysql` from your shell, you are greeted by an infinite prompt loop that reads user queries, parses and executes them, and formats the table output back to stdout.

The REPL is the gateway to your storage engine. Because human input is unpredictable, a systems-level REPL must enforce strict resiliency guarantees:
- It must **never crash** or segfault on long queries, empty newlines, or unusual formatting.
- It must gracefully clean up dynamic heap buffers when encountering an **End-of-File (EOF)** signal (such as `Ctrl+D` or piped input streams).

## The Two Types of Commands

When designing the evaluator routing loop, user input is divided into two distinct architectural tracks:

1. **Meta-Commands (Dot Commands)**: Any query beginning with a '.' character (such as `.exit` or `.help`) represents an internal administrative instruction. These are parsed directly by the REPL interface layer and never touch the SQL compiler pipeline.
2. **SQL Statements**: All other valid queries (such as `SELECT`, `INSERT`, or `CREATE`) represent logical relational data operations and are delegated to the Lexer and Syntax Parser stages.

