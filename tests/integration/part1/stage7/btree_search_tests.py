from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage7"
STAGE_TITLE = "B-Tree Search & SELECT Execution"


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
    check_key_order: bool = False


CASES: list[TestCase] = [
    TestCase(
        name="btree-find-existing",
        header="Find an existing key in the B-tree",
        description="After inserting a row with id=1, 'btree find 1' should return FOUND with row data.",
        test_input=(
            "insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n"
            "btree find 1\n"
            ".exit\n"
        ),
        expected="FOUND with row data showing id=1 and 'danimar'",
        must_contain=["Find key=1: FOUND", "id=1", "danimar"],
    ),
    TestCase(
        name="btree-find-missing",
        header="Find a non-existent key returns NOT_FOUND",
        description="Searching for key=99 in an empty or populated tree should return NOT_FOUND.",
        test_input=(
            "btree find 99\n"
            ".exit\n"
        ),
        expected="NOT_FOUND for key=99",
        must_contain=["Find key=99: NOT_FOUND"],
    ),
    TestCase(
        name="btree-sorted-insert",
        header="Keys are stored in sorted order",
        description="Inserting keys 3, 1, 2 should result in cells ordered 1, 2, 3 when dumped.",
        test_input=(
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');\n"
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "btree dump 0\n"
            ".exit\n"
        ),
        expected="Cells in key order: Cell 0: key=1, Cell 1: key=2, Cell 2: key=3",
        must_contain=["Cell 0: key=1", "Cell 1: key=2", "Cell 2: key=3"],
    ),
    TestCase(
        name="btree-find-after-multiple",
        header="All inserted keys are findable",
        description="After inserting 3 rows, each key should be FOUND via 'btree find'.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');\n"
            "btree find 1\n"
            "btree find 2\n"
            "btree find 3\n"
            ".exit\n"
        ),
        expected="All three keys return FOUND",
        must_contain=["Find key=1: FOUND", "Find key=2: FOUND", "Find key=3: FOUND"],
    ),
    TestCase(
        name="select-after-insert",
        header="SELECT returns inserted rows",
        description="After inserting 2 rows, 'select * from users;' should output both rows.",
        test_input=(
            "insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n"
            "insert into users (id, name, email) values (2, 'alice', 'alice@test.com');\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="Both inserted rows in SELECT output",
        must_contain=["danimar", "alice", "(2 rows)"],
    ),
    TestCase(
        name="select-empty-table",
        header="SELECT on empty table returns zero rows",
        description="On a fresh database, 'select * from users;' should return no rows.",
        test_input="select * from users;\n.exit\n",
        expected="(0 rows) or empty result",
        must_contain=["(0 rows)"],
    ),
    TestCase(
        name="select-row-count",
        header="SELECT row count matches inserted rows",
        description="After inserting 3 rows, the row count should be (3 rows).",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'a@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'b@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'c@test.com');\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="(3 rows) in output",
        must_contain=["(3 rows)"],
    ),
    TestCase(
        name="select-column-headers",
        header="SELECT output includes column headers",
        description="The SELECT output should start with column header names.",
        test_input=(
            "insert into users (id, name, email) values (1, 'test', 'test@test.com');\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="Column headers: id | name | email",
        must_contain=["id | name | email"],
    ),
    TestCase(
        name="btree-duplicate-key-error",
        header="Inserting duplicate key returns error",
        description="Inserting two rows with the same id should produce an error.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'a@test.com');\n"
            "insert into users (id, name, email) values (1, 'bob', 'b@test.com');\n"
            ".exit\n"
        ),
        expected="Error on duplicate key insertion",
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
