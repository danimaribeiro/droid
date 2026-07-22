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
- Input: .foo, then .exit
- Expect: process exits with status 0, output includes error code for .foo, and prompt marker

3. invalid-meta-command-error-code
- Input: .foo
- Expect: error code marker in output

4. empty-line-no-crash
- Input: empty line
- Expect: no crash (at least no segfault status 139) and prompt marker in output

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
- Expect: no crash (at least no segfault status 139) and prompt marker in output

9. long-line-no-crash
- Input: very long line
- Expect: no crash (at least no segfault status 139) and prompt marker in output

10. cli-c-help-unimplemented-error-code
- Input: CLI args `-c ".help"`
- Expect: error code marker in output

11. cli-c-select-unimplemented-error-code
- Input: CLI args `-c "select 1;"`
- Expect: error code marker in output

12. cli-c-missing-argument-fails
- Input: CLI args `-c` (without command)
- Expect: non-zero exit code

How to run:
- make test
- make test-stage1
- make test-c-stage1
- make test-cpp-stage1
- make test-rust-stage1
- make test-zig-stage1
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
- PASS: compact one-line status (`binary + case + PASS`)
- FAIL: detailed block with:
	- case
	- binary
	- args
	- status
	- input
	- expected
	- actual
	- exit_code
	- reason

Optional customization:
- ERR_CODE_REGEX="your_regex" make test-stage1
- PROMPT_REGEX="your_regex" make test-stage1

Evolution path:
- As features are implemented, move each command from error expectations to success expectations.
- Keep the same runner and only update/add cases.
