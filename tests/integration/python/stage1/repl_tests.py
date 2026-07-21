from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Iterable

from utils import CommandResult, check_regex, run_command


STAGE_ID = "stage1"
STAGE_TITLE = "User REPL"
ERR_CODE_REGEX = os.getenv("ERR_CODE_REGEX", r"(ERR_[A-Z_]+:E[0-9]{4}|E[0-9]{4})")


@dataclass
class TestCase:
    name: str
    header: str
    description: str
    test_input: str
    expected: str
    mode: str


CASES: list[TestCase] = [
    TestCase(
        name="help-unimplemented-error-code",
        header="Help command not implemented",
        description="Validates that .help currently returns a structured error code.",
        test_input=".help\n",
        expected=f"output matches regex: {ERR_CODE_REGEX}",
        mode="regex_error",
    ),
    TestCase(
        name="exit-command-status",
        header="Exit command works",
        description="Ensures .exit closes the REPL with success status.",
        test_input=".exit\n",
        expected="exit code == 0",
        mode="exit_zero",
    ),
    TestCase(
        name="invalid-meta-command-error-code",
        header="Unknown meta command returns error",
        description="Checks .foo is rejected with an error code.",
        test_input=".foo\n",
        expected=f"output matches regex: {ERR_CODE_REGEX}",
        mode="regex_error",
    ),
    TestCase(
        name="empty-line-no-crash",
        header="Empty line is safe",
        description="Confirms blank input does not crash the process.",
        test_input="\n",
        expected="must not crash with segfault (exit code 139)",
        mode="no_segfault",
    ),
    TestCase(
        name="trimmed-help-unimplemented-error-code",
        header="Trimmed command still handled",
        description="Verifies spacing around .help still yields coded error.",
        test_input="   .help   \n",
        expected=f"output matches regex: {ERR_CODE_REGEX}",
        mode="regex_error",
    ),
    TestCase(
        name="sql-select-unimplemented-error-code",
        header="Select not implemented yet",
        description="Checks select 1; currently returns error with code.",
        test_input="select 1;\n",
        expected=f"output matches regex: {ERR_CODE_REGEX}",
        mode="regex_error",
    ),
    TestCase(
        name="mixed-session-order",
        header="Mixed session remains stable",
        description="Runs invalid, SQL, and exit commands in sequence.",
        test_input=".foo\nselect 1;\n.exit\n",
        expected=f"output contains at least one error code matching: {ERR_CODE_REGEX}",
        mode="regex_error",
    ),
    TestCase(
        name="eof-no-crash",
        header="EOF is handled cleanly",
        description="Ensures end-of-input does not crash the binary.",
        test_input="",
        expected="must not crash with segfault (exit code 139)",
        mode="no_segfault",
    ),
    TestCase(
        name="long-line-no-crash",
        header="Long line is safe",
        description="Stress test with a long input line to avoid crash regressions.",
        test_input=("x" * 4096) + "\n",
        expected="must not crash with segfault (exit code 139)",
        mode="no_segfault",
    ),
]


def run_case(binary: str, case: TestCase) -> CommandResult:
    exit_code, stdout, stderr = run_command(binary=binary, test_input=case.test_input)
    actual_text = f"{stdout}{stderr}"

    if case.mode == "regex_error":
        passed = check_regex(actual_text, ERR_CODE_REGEX)
        reason = "" if passed else "No error code found in output"
    elif case.mode == "exit_zero":
        passed = exit_code == 0
        reason = "" if passed else "Process did not exit with status 0"
    elif case.mode == "no_segfault":
        passed = exit_code != 139
        reason = "" if passed else "Segmentation fault detected (139)"
    else:
        passed = False
        reason = f"Unknown test mode: {case.mode}"

    return CommandResult(
        stage=STAGE_ID,
        stage_title=STAGE_TITLE,
        binary=binary,
        case_name=case.name,
        case_header=case.header,
        case_description=case.description,
        test_input=case.test_input,
        expected=case.expected,
        stdout=stdout,
        stderr=stderr,
        exit_code=exit_code,
        passed=passed,
        reason=reason,
    )


def run_suite(binaries: Iterable[str]) -> list[CommandResult]:
    results: list[CommandResult] = []
    for binary in binaries:
        for case in CASES:
            results.append(run_case(binary, case))
    return results
