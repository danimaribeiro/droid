# Stage 1 REPL Integration Test Plan

Scope now:
- SQL is still not implemented.
- Any command not implemented must return an error with code.
- .exit must terminate cleanly.

Current test cases:
1. help-unimplemented-error-code
- Input: .help
- Expect: error code marker in output
- Default regex: (ERR_[A-Z_]+:E[0-9]{4}|E[0-9]{4})

2. exit-command-status
- Input: .exit
- Expect: process exits with status 0

3. invalid-meta-command-error-code
- Input: .foo
- Expect: error code marker in output

4. empty-line-no-crash
- Input: empty line
- Expect: no crash (at least no segfault status 139)

5. trimmed-help-unimplemented-error-code
- Input: spaces + .help + spaces
- Expect: error code marker in output

6. sql-select-unimplemented-error-code
- Input: select 1;
- Expect: error code marker in output

7. mixed-session-order
- Input: .foo, select 1;, .exit
- Expect: contains error code marker in the session output

8. eof-no-crash
- Input: EOF directly on stdin
- Expect: no crash (at least no segfault status 139)

9. long-line-no-crash
- Input: very long line
- Expect: no crash (at least no segfault status 139)

How to run:
- make test
- make test-stage1
- make test-stage2
- make test-stage3
- make test-all-stages

Python test architecture:
- tests/integration/python/utils.py
- tests/integration/python/stage1/repl_tests.py
- tests/integration/python/stage2/parser_tests.py
- tests/integration/python/stage3/planner_executor_tests.py
- tests/integration/python/run_tests.py

Detailed output format (per case):
- case
- binary
- status
- input
- expected
- actual
- exit_code
- reason (only when fail)

Optional customization:
- ERR_CODE_REGEX="your_regex" make test-repl-stage1

Evolution path:
- As features are implemented, move each command from error expectations to success expectations.
- Keep the same runner and only update/add cases.
