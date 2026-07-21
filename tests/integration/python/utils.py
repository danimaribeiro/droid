from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass


@dataclass
class CommandResult:
    stage: str
    stage_title: str
    binary: str
    case_name: str
    case_header: str
    case_description: str
    test_input: str
    expected: str
    stdout: str
    stderr: str
    exit_code: int
    passed: bool
    reason: str

    @property
    def actual_output(self) -> str:
        if self.stderr.strip():
            return f"{self.stdout}{self.stderr}"
        return self.stdout


def run_command(binary: str, test_input: str, timeout_seconds: int = 3) -> tuple[int, str, str]:
    proc = subprocess.run(
        [binary],
        input=test_input,
        text=True,
        capture_output=True,
        timeout=timeout_seconds,
        check=False,
    )
    return proc.returncode, proc.stdout, proc.stderr


def check_regex(actual_text: str, regex_pattern: str) -> bool:
    return re.search(regex_pattern, actual_text, flags=re.MULTILINE) is not None


def format_result(result: CommandResult) -> str:
    input_repr = result.test_input.replace("\n", "\\n")
    actual = result.actual_output.replace("\n", "\\n")

    lines = [
        f"stage: {result.stage} ({result.stage_title})",
        f"test: {result.case_header}",
        f"about: {result.case_description}",
        f"case: {result.case_name}",
        f"binary: {result.binary}",
        f"status: {'PASS' if result.passed else 'FAIL'}",
        f"input: {input_repr}",
        f"expected: {result.expected}",
        f"actual: {actual}",
        f"exit_code: {result.exit_code}",
    ]

    if result.reason:
        lines.append(f"reason: {result.reason}")

    return "\n".join(lines)
