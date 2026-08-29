from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Iterable

from utils import CommandResult, check_regex, run_command


STAGE_ID = "stage1"
STAGE_TITLE = "User REPL"
ERR_CODE_REGEX = os.getenv("ERR_CODE_REGEX", r"(\[ERROR:\d+\]|ERR_[A-Z_]+:E[0-9]{4}|E[0-9]{4})")
PROMPT_REGEX = os.getenv("PROMPT_REGEX", r"(db\s*>|droid\s*>|(^|\n)>)")


@dataclass
class TestCase:
    name: str
    header: str
    description: str
    cli_args: list[str]
    test_input: str
    expected: str
    mode: str


CASES: list[TestCase] = [
    TestCase(
        name="help-command-works",
        header="Help command works correctly",
        description="Validates that .help displays available commands.",
        cli_args=[],
        test_input=".help\n.exit\n",
        expected="output contains 'Available commands:' and lists '.exit' and '.help'",
        mode="help_works",
    ),
    TestCase(
        name="exit-command-status",
        header="Exit command after prior input",
        description="Checks REPL processes a command, shows prompt, then exits cleanly.",
        cli_args=[],
        test_input=".foo\n.exit\n",
        expected=(
            "exit code == 0, output includes an error code (e.g. [ERROR:001]) "
            "for the unknown command, and shows a prompt (e.g. 'db > ')"
        ),
        mode="exit_after_command_with_prompt",
    ),
    TestCase(
        name="invalid-meta-command-error-code",
        header="Unknown meta command returns error",
        description="Checks .foo is rejected with an error code.",
        cli_args=[],
        test_input=".foo\n.exit\n",
        expected="output contains an error code, e.g. [ERROR:001] or ERR_UNKNOWN:E0001",
        mode="regex_error",
    ),
    TestCase(
        name="empty-line-no-crash",
        header="Empty line is safe",
        description="Confirms blank input does not crash and REPL prompt is visible.",
        cli_args=[],
        test_input="\n.exit\n",
        expected=(
            "must not crash (no segfault) and output shows a prompt (e.g. 'db > ')"
        ),
        mode="prompt_and_no_segfault",
    ),
    TestCase(
        name="trimmed-help-with-spaces",
        header="Trimmed command still works",
        description="Verifies spacing around .help still executes command correctly.",
        cli_args=[],
        test_input="   .help   \n.exit\n",
        expected="output contains 'Available commands:' (trimmed input should still work)",
        mode="help_works",
    ),
    TestCase(
        name="sql-select-unimplemented-error-code",
        header="Select not implemented yet",
        description="Checks select 1; currently returns error with code.",
        cli_args=[],
        test_input="select 1;\n.exit\n",
        expected="output contains an error code, e.g. [ERROR:002] or ERR_UNIMPLEMENTED:E0002",
        mode="regex_error",
    ),
    TestCase(
        name="mixed-session-order",
        header="Mixed session remains stable",
        description="Runs invalid, SQL, and exit commands in sequence.",
        cli_args=[],
        test_input=".foo\nselect 1;\n.exit\n",
        expected="output contains at least one error code, e.g. [ERROR:001]",
        mode="regex_error",
    ),
    TestCase(
        name="eof-no-crash",
        header="EOF is handled cleanly",
        description="Ensures end-of-input does not crash and prompt is visible.",
        cli_args=[],
        test_input="",
        expected="must not crash (no segfault) and output shows a prompt (e.g. 'db > ')",
        mode="prompt_and_no_segfault",
    ),
    TestCase(
        name="long-line-no-crash",
        header="Long line is safe",
        description="Stress test ensures no crash and prompt visibility after long input.",
        cli_args=[],
        test_input=("x" * 4096) + "\n.exit\n",
        expected="must not crash (no segfault) and output shows a prompt (e.g. 'db > ')",
        mode="prompt_and_no_segfault",
    ),
    TestCase(
        name="cli-c-select-unimplemented-error-code",
        header="-c executes one-shot SQL command",
        description="Checks -c accepts SQL and returns coded error while SQL is not implemented.",
        cli_args=["-c", "select 1;"],
        test_input="",
        expected="output contains an error code, e.g. [ERROR:002] or ERR_UNIMPLEMENTED:E0002",
        mode="regex_error",
    ),
    TestCase(
        name="cli-c-missing-argument-fails",
        header="-c requires command argument",
        description="Checks process returns non-zero when -c is provided without a command.",
        cli_args=["-c"],
        test_input="",
        expected="exit code != 0",
        mode="nonzero_exit",
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
            cli_args=case.cli_args,
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
    elif case.mode == "exit_after_command_with_prompt":
        has_error_code = check_regex(actual_text, ERR_CODE_REGEX)
        has_prompt = check_regex(actual_text, PROMPT_REGEX)
        has_exit_zero = exit_code == 0

        passed = has_error_code and has_prompt and has_exit_zero

        reasons: list[str] = []
        if not has_error_code:
            reasons.append("Missing error code for command before .exit")
        if not has_prompt:
            reasons.append("Prompt not found in output")
        if not has_exit_zero:
            reasons.append("Process did not exit with status 0")

        reason = "; ".join(reasons)
    elif case.mode == "no_segfault":
        passed = exit_code != 139
        reason = "" if passed else "Segmentation fault detected (139)"
    elif case.mode == "prompt_and_no_segfault":
        has_prompt = check_regex(actual_text, PROMPT_REGEX)
        no_segfault = exit_code != 139

        passed = has_prompt and no_segfault

        reasons: list[str] = []
        if not has_prompt:
            reasons.append("Prompt not found in output")
        if not no_segfault:
            reasons.append("Segmentation fault detected (139)")

        reason = "; ".join(reasons)
    elif case.mode == "nonzero_exit":
        passed = exit_code != 0
        reason = "" if passed else "Expected non-zero exit code"
    elif case.mode == "help_works":
        has_help_header = "Available commands:" in actual_text
        has_exit_cmd = ".exit" in actual_text
        has_help_cmd = ".help" in actual_text
        
        passed = has_help_header and has_exit_cmd and has_help_cmd
        
        reasons: list[str] = []
        if not has_help_header:
            reasons.append("Missing 'Available commands:' header")
        if not has_exit_cmd:
            reasons.append("Missing '.exit' in command list")
        if not has_help_cmd:
            reasons.append("Missing '.help' in command list")
        
        reason = "; ".join(reasons)
    else:
        passed = False
        reason = f"Unknown test mode: {case.mode}"

    return CommandResult(
        stage=STAGE_ID,
        stage_title=STAGE_TITLE,
        binary=binary,
        cli_args=case.cli_args,
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
