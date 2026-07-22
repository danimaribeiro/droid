from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Iterable

from utils import CommandResult, check_regex, run_command


STAGE_ID = "stage2"
STAGE_TITLE = "SQL Parser"
ERR_CODE_REGEX = os.getenv("ERR_CODE_REGEX", r"(\[ERROR:\d+\]|ERR_[A-Z_]+:E[0-9]{4}|E[0-9]{4})")
AST_PREFIX = "[AST]"


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

    def __post_init__(self) -> None:
        if self.cli_args is None:
            self.cli_args = []


CASES: list[TestCase] = [
    TestCase(
        name="explain-insert-valid",
        header="Valid INSERT statement is parsed correctly",
        description="Checks if 'explain insert into users values (1, 'name', 'email');' outputs correct AST.",
        test_input="explain insert into users values (1, 'danimar', 'danimar@email.com');\n.exit\n",
        expected="AST dump with Statement: INSERT, Table: users, Values: [1, 'danimar', 'danimar@email.com']",
        mode="ast_insert_match",
    ),
    TestCase(
        name="explain-select-valid",
        header="Valid SELECT statement is parsed correctly",
        description="Checks if 'explain select * from users;' outputs correct AST.",
        test_input="explain select * from users;\n.exit\n",
        expected="AST dump with Statement: SELECT, Table: users, Columns: [*]",
        mode="ast_select_match",
    ),
    TestCase(
        name="insert-execution-unimplemented",
        header="Standard INSERT returns Unimplemented",
        description="Checks if standard 'insert' command (without explain) returns execution not implemented.",
        test_input="insert into users values (1, 'danimar', 'danimar@email.com');\n.exit\n",
        expected="output contains error code [ERROR:00101]",
        mode="specific_error",
        expected_error_code="[ERROR:00101]"
    ),
    TestCase(
        name="explain-insert-missing-args",
        header="Missing arguments in INSERT",
        description="Checks if missing values in INSERT returns syntax error.",
        test_input="explain insert into users values (1, 'danimar');\n.exit\n",
        expected="output contains error code [ERROR:00302]",
        mode="specific_error",
        expected_error_code="[ERROR:00302]"
    ),
    TestCase(
        name="explain-insert-invalid-id",
        header="Invalid ID type in INSERT",
        description="Checks if non-numeric ID in INSERT returns syntax error.",
        test_input="explain insert into users values (abc, 'danimar', 'danimar@email.com');\n.exit\n",
        expected="output contains error code [ERROR:00303]",
        mode="specific_error",
        expected_error_code="[ERROR:00303]"
    ),
    TestCase(
        name="explain-insert-name-too-long",
        header="Name string is too long",
        description="Checks if name exceeding 32 characters in INSERT returns syntax/validation error.",
        test_input="explain insert into users values (1, 'this_is_a_very_long_name_that_exceeds_32_characters', 'email@test.com');\n.exit\n",
        expected="output contains error code [ERROR:00304]",
        mode="specific_error",
        expected_error_code="[ERROR:00304]"
    ),
    TestCase(
        name="explain-unrecognized-sql",
        header="Unrecognized SQL keyword",
        description="Checks if unsupported SQL (e.g. DELETE) returns unrecognized keyword error.",
        test_input="explain delete from users;\n.exit\n",
        expected="output contains error code [ERROR:00301]",
        mode="specific_error",
        expected_error_code="[ERROR:00301]"
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
        passed = check_regex(actual_text, ERR_CODE_REGEX)
        reason = "" if passed else "No error code found in output"
    elif case.mode == "specific_error":
        if case.expected_error_code is None:
            passed = False
            reason = "Test configuration error: missing expected_error_code"
        else:
            passed = case.expected_error_code in actual_text
            reason = "" if passed else f"Expected error code {case.expected_error_code} not found in output"
    elif case.mode == "ast_insert_match":
        has_statement = "Statement: INSERT" in actual_text
        has_table = "Table: users" in actual_text
        has_values = "Values: [1, 'danimar', 'danimar@email.com']" in actual_text

        passed = has_statement and has_table and has_values

        reasons = []
        if not has_statement:
            reasons.append("Missing 'Statement: INSERT' in output")
        if not has_table:
            reasons.append("Missing 'Table: users' in output")
        if not has_values:
            reasons.append("Missing 'Values: [1, 'danimar', 'danimar@email.com']' in output")
        
        reason = "; ".join(reasons)
    elif case.mode == "ast_select_match":
        has_statement = "Statement: SELECT" in actual_text
        has_table = "Table: users" in actual_text
        has_columns = "Columns: [*]" in actual_text

        passed = has_statement and has_table and has_columns

        reasons = []
        if not has_statement:
            reasons.append("Missing 'Statement: SELECT' in output")
        if not has_table:
            reasons.append("Missing 'Table: users' in output")
        if not has_columns:
            reasons.append("Missing 'Columns: [*]' in output")
        
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
