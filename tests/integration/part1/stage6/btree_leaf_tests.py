from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage6"
STAGE_TITLE = "B-Tree Leaf Node & INSERT Execution"


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
        name="btree-dump-empty",
        header="Dump empty B-tree root page",
        description="On a fresh database, 'btree dump 0' should show an empty leaf node.",
        test_input="btree dump 0\n.exit\n",
        expected="[BTREE] Page 0: type=LEAF num_cells=0",
        must_contain=["[BTREE]", "type=LEAF", "num_cells=0"],
    ),
    TestCase(
        name="btree-insert-one-dump",
        header="Insert one row and dump B-tree",
        description="After inserting one row, 'btree dump 0' should show 1 cell with the correct key.",
        test_input=(
            "insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n"
            "btree dump 0\n"
            ".exit\n"
        ),
        expected="num_cells=1 with key=1",
        must_contain=["num_cells=1", "key=1"],
    ),
    TestCase(
        name="btree-insert-three-dump",
        header="Insert three rows and verify cell count",
        description="After inserting three rows, 'btree dump 0' should show 3 cells.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');\n"
            "btree dump 0\n"
            ".exit\n"
        ),
        expected="num_cells=3 with all three keys",
        must_contain=["num_cells=3", "key=1", "key=2", "key=3"],
    ),
    TestCase(
        name="btree-insert-custom-key",
        header="Insert with non-sequential key shows in dump",
        description="Inserting a row with id=42 should appear as key=42 in the B-tree dump.",
        test_input=(
            "insert into users (id, name, email) values (42, 'test', 'test@test.com');\n"
            "btree dump 0\n"
            ".exit\n"
        ),
        expected="key=42 in dump output",
        must_contain=["key=42"],
    ),
    TestCase(
        name="btree-insert-no-error",
        header="INSERT executes without error",
        description="A valid INSERT should succeed without producing any error codes.",
        test_input=(
            "insert into users (id, name, email) values (1, 'test', 'test@test.com');\n"
            ".exit\n"
        ),
        expected="No error codes in output",
        must_contain=[],
        must_not_contain=["[ERROR:"],
    ),
    TestCase(
        name="btree-node-type-leaf",
        header="B-tree node reports correct type",
        description="After insert, the root page should still be a LEAF node (no splits yet).",
        test_input=(
            "insert into users (id, name, email) values (1, 'test', 'test@test.com');\n"
            "btree dump 0\n"
            ".exit\n"
        ),
        expected="type=LEAF in dump output",
        must_contain=["[BTREE] Page 0:", "type=LEAF"],
    ),
    TestCase(
        name="btree-dump-default",
        header="Dump without argument defaults to root page 0",
        description="Invoking 'btree dump' without providing a page index should default to dumping root page 0.",
        test_input="btree dump\n.exit\n",
        expected="[BTREE] Page 0: type=LEAF in dump output",
        must_contain=["[BTREE] Page 0:", "type=LEAF"],
    ),
    TestCase(
        name="btree-dump-out-of-bounds",
        header="Dump on an unallocated or out-of-bounds page returns clean error",
        description="Invoking 'btree dump 999' on a non-existent page index should abort cleanly with an error message.",
        test_input="btree dump 999\n.exit\n",
        expected="ERROR in output",
        must_contain=["ERROR"],
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
    clean_db_files()
    return results
