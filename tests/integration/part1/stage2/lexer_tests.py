from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable

from utils import CommandResult, check_regex, run_command


STAGE_ID = "stage2"
STAGE_TITLE = "SQL Lexer"
ERR_CODE_REGEX = os.getenv("ERR_CODE_REGEX", r"(\[ERROR:\d+\]|ERR_[A-Z_]+:E[0-9]{4}|E[0-9]{4})")


@dataclass
class TestCase:
    name: str
    header: str
    description: str
    test_input: str
    expected: str
    mode: str
    cli_args: list[str] | None = None
    expected_error_code: str | None = None
    expected_tokens: list[str] | None = None

    def __post_init__(self) -> None:
        if self.cli_args is None:
            self.cli_args = []


CASES: list[TestCase] = [
    TestCase(
        name="tokenize-select-valid",
        header="Valid SELECT statement is tokenized correctly",
        description="Checks if 'tokenize select * from users;' outputs correct tokens.",
        test_input="tokenize select * from users;\n.exit\n",
        expected="output contains the exact token sequence",
        mode="token_match",
        expected_tokens=[
            "[KEYWORD_SELECT - select]",
            "[SYMBOL - *]",
            "[KEYWORD_FROM - from]",
            "[IDENTIFIER - users]",
            "[SYMBOL - ;]"
        ]
    ),
    TestCase(
        name="tokenize-insert-valid",
        header="Valid INSERT statement is tokenized correctly",
        description="Checks if 'tokenize insert into users (id, name) values (1, \'danimar\');' outputs correct tokens.",
        test_input="tokenize insert into users (id, name) values (1, 'danimar');\n.exit\n",
        expected="output contains the exact token sequence",
        mode="token_match",
        expected_tokens=[
            "[KEYWORD_INSERT - insert]",
            "[KEYWORD_INTO - into]",
            "[IDENTIFIER - users]",
            "[SYMBOL - (]",
            "[IDENTIFIER - id]",
            "[SYMBOL - ,]",
            "[IDENTIFIER - name]",
            "[SYMBOL - )]",
            "[KEYWORD_VALUES - values]",
            "[SYMBOL - (]",
            "[NUMBER - 1]",
            "[SYMBOL - ,]",
            "[STRING - danimar]",
            "[SYMBOL - )]",
            "[SYMBOL - ;]"
        ]
    ),
    TestCase(
        name="tokenize-update-valid",
        header="Valid UPDATE statement is tokenized correctly",
        description="Checks if 'tokenize UPDATE users SET name = \'danimar\' WHERE id = 1;' outputs correct tokens.",
        test_input="tokenize UPDATE users SET name = 'danimar' WHERE id = 1;\n.exit\n",
        expected="output contains the exact token sequence",
        mode="token_match",
        expected_tokens=[
            "[KEYWORD_UPDATE - UPDATE]",
            "[IDENTIFIER - users]",
            "[KEYWORD_SET - SET]",
            "[IDENTIFIER - name]",
            "[SYMBOL - =]",
            "[STRING - danimar]",
            "[KEYWORD_WHERE - WHERE]",
            "[IDENTIFIER - id]",
            "[SYMBOL - =]",
            "[NUMBER - 1]",
            "[SYMBOL - ;]"
        ]
    ),
    TestCase(
        name="tokenize-delete-valid",
        header="Valid DELETE statement is tokenized correctly",
        description="Checks if 'tokenize delete from users where id = 1;' outputs correct tokens.",
        test_input="tokenize delete from users where id = 1;\n.exit\n",
        expected="output contains the exact token sequence",
        mode="token_match",
        expected_tokens=[
            "[KEYWORD_DELETE - delete]",
            "[KEYWORD_FROM - from]",
            "[IDENTIFIER - users]",
            "[KEYWORD_WHERE - where]",
            "[IDENTIFIER - id]",
            "[SYMBOL - =]",
            "[NUMBER - 1]",
            "[SYMBOL - ;]"
        ]
    ),
    TestCase(
        name="tokenize-select-where-valid",
        header="Valid SELECT with WHERE is tokenized correctly",
        description="Checks if 'tokenize select * from users where id = 1;' outputs correct tokens.",
        test_input="tokenize select * from users where id = 1;\n.exit\n",
        expected="output contains the exact token sequence",
        mode="token_match",
        expected_tokens=[
            "[KEYWORD_SELECT - select]",
            "[SYMBOL - *]",
            "[KEYWORD_FROM - from]",
            "[IDENTIFIER - users]",
            "[KEYWORD_WHERE - where]",
            "[IDENTIFIER - id]",
            "[SYMBOL - =]",
            "[NUMBER - 1]",
            "[SYMBOL - ;]"
        ]
    ),
    TestCase(
        name="tokenize-upper-case-valid",
        header="Uppercase SELECT is tokenized correctly",
        description="Checks if 'tokenize SELECT * FROM users;' outputs correct tokens.",
        test_input="tokenize SELECT * FROM users;\n.exit\n",
        expected="output contains the exact token sequence",
        mode="token_match",
        expected_tokens=[
            "[KEYWORD_SELECT - SELECT]",
            "[SYMBOL - *]",
            "[KEYWORD_FROM - FROM]",
            "[IDENTIFIER - users]",
            "[SYMBOL - ;]"
        ]
    ),
    TestCase(
        name="tokenize-missing-quote",
        header="Missing quote returns error",
        description="Checks if missing closing quote returns syntax error.",
        test_input="tokenize insert into users values (1, 'danimar);\n.exit\n",
        expected="output contains error message and syntax error",
        mode="regex_error",
    ),
    TestCase(
        name="tokenize-invalid-character",
        header="Invalid character returns error",
        description="Checks if invalid symbol returns syntax error.",
        test_input="tokenize select # from users;\n.exit\n",
        expected="output contains error message and syntax error",
        mode="regex_error",
    ),
]


def run_case(binary: str, case: TestCase) -> CommandResult:
    exit_code, stdout, stderr, timed_out = run_command(
        binary=binary,
        test_input=case.test_input,
        cli_args=case.cli_args,
    )
    actual_text = f"{stdout}{stderr}"

    if timed_out:
        return CommandResult(
            stage=STAGE_ID,
            stage_title=STAGE_TITLE,
            binary=binary,
            cli_args=case.cli_args or [],
            case_name=case.name,
            case_header=case.header,
            case_description=case.description,
            test_input=case.test_input,
            expected=case.expected,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            timed_out=True,
            passed=False,
            reason="Command timed out while waiting for program output/termination",
        )

    if case.mode == "regex_error":
        # At this stage, lexer prints "Syntax error in command" directly instead of standard error code yet
        passed = "Syntax error in command" in actual_text
        reason = "" if passed else "No syntax error message found in output"
    elif case.mode == "token_match":
        if case.expected_tokens is None:
            passed = False
            reason = "Test configuration error: missing expected_tokens"
        else:
            reasons = []
            for token in case.expected_tokens:
                if token not in actual_text:
                    reasons.append(f"Missing token: {token}")
            
            passed = len(reasons) == 0
            reason = "; ".join(reasons)
    else:
        passed = False
        reason = f"Unknown test mode: {case.mode}"

    return CommandResult(
        stage=STAGE_ID,
        stage_title=STAGE_TITLE,
        binary=binary,
        cli_args=case.cli_args or [],
        case_name=case.name,
        case_header=case.header,
        case_description=case.description,
        test_input=case.test_input,
        expected=case.expected,
        stdout=stdout,
        stderr=stderr,
        exit_code=exit_code,
        timed_out=False,
        passed=passed,
        reason=reason,
    )


def run_suite(binaries: Iterable[str]) -> list[CommandResult]:
    results: list[CommandResult] = []
    for binary in binaries:
        for case in CASES:
            print(f"[RUN] binary={binary} case={case.name}", flush=True)
            results.append(run_case(binary, case))
    return results
