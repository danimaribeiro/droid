from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage5"
STAGE_TITLE = "The Pager & Buffer Pool"


@dataclass
class TestCase:
    name: str
    header: str
    description: str
    test_input: str
    expected: str
    must_contain: list[str]
    must_not_contain: list[str] = field(default_factory=list)
    cli_args: list[str] = field(default_factory=list)
    clean_db: bool = True


CASES: list[TestCase] = [
    TestCase(
        name="pager-status-fresh",
        header="Pager status on fresh database",
        description="Checks that 'pager status' on a freshly opened database reports zero or minimal pages.",
        test_input="pager status\n.exit\n",
        expected="[PAGER] Status line with total_pages=0",
        must_contain=["[PAGER] Status:", "total_pages=0"],
    ),
    TestCase(
        name="pager-alloc-first",
        header="Allocate the first page",
        description="Checks that 'pager alloc' creates page 0 and outputs the allocation confirmation.",
        test_input="pager alloc\n.exit\n",
        expected="[PAGER] Alloc output with page 0",
        must_contain=["[PAGER] Alloc:", "page 0"],
    ),
    TestCase(
        name="pager-status-after-alloc",
        header="Status reflects allocated page count",
        description="After allocating one page, 'pager status' should show total_pages=1.",
        test_input="pager alloc\npager status\n.exit\n",
        expected="total_pages=1 after one alloc",
        must_contain=["total_pages=1"],
    ),
    TestCase(
        name="pager-get-cached",
        header="Get a recently allocated page returns CACHE_HIT",
        description="After allocating page 0, 'pager get 0' should report a cache hit.",
        test_input="pager alloc\npager get 0\n.exit\n",
        expected="CACHE_HIT for page 0",
        must_contain=["[PAGER] Get page 0:", "CACHE_HIT"],
    ),
    TestCase(
        name="pager-get-out-of-bounds",
        header="Get an out-of-bounds page returns error",
        description="Requesting page 999 (beyond TABLE_MAX_PAGES) should produce an error.",
        test_input="pager get 999\n.exit\n",
        expected="Error for out-of-bounds page access",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="pager-alloc-multiple",
        header="Multiple allocations increment page count",
        description="After allocating 3 pages, status should show total_pages=3.",
        test_input="pager alloc\npager alloc\npager alloc\npager status\n.exit\n",
        expected="total_pages=3 after three allocs",
        must_contain=["total_pages=3"],
    ),
]


def run_case(binary: str, case: TestCase) -> CommandResult:
    if case.clean_db:
        clean_db_files()

    exit_code, stdout, stderr, timed_out = run_command(
        binary=binary,
        test_input=case.test_input,
        cli_args=case.cli_args or None,
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

    missing = [s for s in case.must_contain if s not in actual_text]
    unwanted = [s for s in case.must_not_contain if s in actual_text]
    passed = len(missing) == 0 and len(unwanted) == 0
    reasons = []
    for s in missing:
        reasons.append(f"Missing in output: '{s}'")
    for s in unwanted:
        reasons.append(f"Should not be in output: '{s}'")
    reason = "; ".join(reasons)

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
    # Clean up after the suite
    clean_db_files()
    return results
