from __future__ import annotations

import os
import re
import subprocess
from dataclasses import dataclass
from typing import Sequence


MAX_OUTPUT_CHARS = int(os.getenv("TEST_MAX_OUTPUT_CHARS", "2000"))

DEFAULT_DB_FILE = "droid.db"


def clean_db_files(*filenames: str) -> None:
    """Remove database files for test isolation between cases."""
    targets = filenames if filenames else (DEFAULT_DB_FILE,)
    for f in targets:
        try:
            os.remove(f)
        except FileNotFoundError:
            pass


def get_default_timeout_seconds() -> float:
    return float(os.getenv("TEST_TIMEOUT_SECONDS", "1.0"))


@dataclass
class CommandResult:
    stage: str
    stage_title: str
    binary: str
    cli_args: list[str]
    case_name: str
    case_header: str
    case_description: str
    test_input: str
    expected: str
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    passed: bool
    reason: str

    @property
    def actual_output(self) -> str:
        if self.stderr.strip():
            return f"{self.stdout}{self.stderr}"
        return self.stdout


def run_command(
    binary: str,
    test_input: str,
    timeout_seconds: float | None = None,
    cli_args: Sequence[str] | None = None,
) -> tuple[int, str, str, bool]:
    effective_timeout = timeout_seconds if timeout_seconds is not None else get_default_timeout_seconds()
    cmd = [binary] + list(cli_args or [])
    try:
        proc = subprocess.run(
            cmd,
            input=test_input,
            text=True,
            capture_output=True,
            timeout=effective_timeout,
            check=False,
        )
        return proc.returncode, proc.stdout, proc.stderr, False
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout if isinstance(exc.stdout, str) else (exc.stdout or b"").decode(
            "utf-8", errors="replace"
        )
        stderr = exc.stderr if isinstance(exc.stderr, str) else (exc.stderr or b"").decode(
            "utf-8", errors="replace"
        )
        if len(stdout) > MAX_OUTPUT_CHARS:
            stdout = (
                stdout[:MAX_OUTPUT_CHARS]
                + f"\n[TRUNCATED] stdout exceeded {MAX_OUTPUT_CHARS} characters"
            )
        if len(stderr) > MAX_OUTPUT_CHARS:
            stderr = (
                stderr[:MAX_OUTPUT_CHARS]
                + f"\n[TRUNCATED] stderr exceeded {MAX_OUTPUT_CHARS} characters"
            )
        stderr = f"{stderr}\n[TIMEOUT] command exceeded {effective_timeout}s".strip()
        return 124, stdout, stderr, True


def check_regex(actual_text: str, regex_pattern: str) -> bool:
    return re.search(regex_pattern, actual_text, flags=re.MULTILINE) is not None


def format_result(result: CommandResult) -> str:
    input_repr = result.test_input.replace("\n", "\\n")
    actual_raw = result.actual_output
    if len(actual_raw) > MAX_OUTPUT_CHARS:
        actual_raw = (
            actual_raw[:MAX_OUTPUT_CHARS]
            + f"\n[TRUNCATED] combined output exceeded {MAX_OUTPUT_CHARS} characters"
        )
    actual = actual_raw.replace("\n", "\\n")

    lines = [
        f"stage: {result.stage} ({result.stage_title})",
        f"test: {result.case_header}",
        f"about: {result.case_description}",
        f"case: {result.case_name}",
        f"binary: {result.binary}",
        f"args: {' '.join(result.cli_args)}",
        f"status: {'PASS' if result.passed else 'FAIL'}",
        f"input: {input_repr}",
        f"expected: {result.expected}",
        f"actual: {actual}",
        f"exit_code: {result.exit_code}",
    ]

    if result.reason:
        lines.append(f"reason: {result.reason}")

    return "\n".join(lines)
