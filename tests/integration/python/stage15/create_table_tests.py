from __future__ import annotations

import os
import shutil
import tempfile
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage14"
STAGE_TITLE = "CREATE TABLE & Schema Catalog"


@dataclass
class TestCase:
    name: str
    header: str
    description: str
    test_input: str
    expected: str
    must_contain: list[str]
    must_not_contain: list[str] = field(default_factory=list)
    clean_db: bool = True
    is_multi_session: bool = False
    setup_commands: list[str] = field(default_factory=list)
    verify_command: str = ""


CASES: list[TestCase] = [
    TestCase(
        name="create-table-basic",
        header="CREATE TABLE succeeds without error",
        description="A valid CREATE TABLE statement should complete without errors.",
        test_input="create table users (id int, name varchar, email varchar);\n.exit\n",
        expected="No error codes",
        must_contain=[],
        must_not_contain=["[ERROR:"],
    ),
    TestCase(
        name="create-table-catalog-list",
        header="Created table appears in catalog list",
        description="After CREATE TABLE, 'catalog list' should show the table definition.",
        test_input=(
            "create table users (id int, name varchar, email varchar);\n"
            "catalog list\n"
            ".exit\n"
        ),
        expected="[CATALOG] shows users table with columns",
        must_contain=["[CATALOG]", "users", "id", "name", "email"],
    ),
    TestCase(
        name="create-table-multiple",
        header="Multiple tables appear in catalog",
        description="Creating two tables should make both visible in the catalog.",
        test_input=(
            "create table users (id int, name varchar, email varchar);\n"
            "create table products (id int, title varchar, price int);\n"
            "catalog list\n"
            ".exit\n"
        ),
        expected="Both tables in catalog",
        must_contain=["users", "products", "title", "price"],
    ),
    TestCase(
        name="create-table-duplicate-error",
        header="Creating the same table twice returns error",
        description="A duplicate CREATE TABLE should produce an error.",
        test_input=(
            "create table users (id int, name varchar, email varchar);\n"
            "create table users (id int, name varchar, email varchar);\n"
            ".exit\n"
        ),
        expected="Error on duplicate table creation",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="create-table-persistence",
        header="Table definition persists across sessions",
        description="After creating a table and restarting, 'catalog list' should still show it.",
        is_multi_session=True,
        test_input="",
        setup_commands=[
            "create table users (id int, name varchar, email varchar);",
        ],
        verify_command="catalog list",
        expected="Table persists in catalog after restart",
        must_contain=["users", "id", "name", "email"],
    ),
    TestCase(
        name="insert-after-create",
        header="INSERT works after CREATE TABLE",
        description="Creating a table then inserting a row should succeed.",
        test_input=(
            "create table users (id int, name varchar, email varchar);\n"
            "insert into users (id, name, email) values (1, 'test', 'test@e.com');\n"
            ".exit\n"
        ),
        expected="No error codes",
        must_contain=[],
        must_not_contain=["[ERROR:"],
    ),
    TestCase(
        name="select-after-create-insert",
        header="Full cycle: CREATE → INSERT → SELECT",
        description="Creating a table, inserting, and selecting should return the inserted data.",
        test_input=(
            "create table users (id int, name varchar, email varchar);\n"
            "insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="danimar in SELECT output",
        must_contain=["danimar", "(1 rows)"],
    ),
    TestCase(
        name="create-table-syntax-error",
        header="Bad CREATE TABLE syntax returns error",
        description="Malformed CREATE TABLE should produce a parser error.",
        test_input="create table;\n.exit\n",
        expected="Error code in output",
        must_contain=["[ERROR:"],
    ),
]


def _run_single_case(binary: str, case: TestCase) -> CommandResult:
    if case.clean_db:
        clean_db_files()

    exit_code, stdout, stderr, timed_out = run_command(
        binary=binary, test_input=case.test_input,
    )
    actual_text = f"{stdout}{stderr}"

    if timed_out:
        return CommandResult(
            stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
            cli_args=[], case_name=case.name, case_header=case.header,
            case_description=case.description, test_input=case.test_input,
            expected=case.expected, stdout=stdout, stderr=stderr,
            exit_code=exit_code, timed_out=True, passed=False,
            reason="Command timed out",
        )

    missing = [s for s in case.must_contain if s not in actual_text]
    unwanted = [s for s in case.must_not_contain if s in actual_text]
    passed = len(missing) == 0 and len(unwanted) == 0
    reasons = []
    for s in missing:
        reasons.append(f"Missing in output: '{s}'")
    for s in unwanted:
        reasons.append(f"Should not be in output: '{s}'")

    return CommandResult(
        stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
        cli_args=[], case_name=case.name, case_header=case.header,
        case_description=case.description, test_input=case.test_input,
        expected=case.expected, stdout=stdout, stderr=stderr,
        exit_code=exit_code, timed_out=False, passed=passed,
        reason="; ".join(reasons),
    )


def _run_multi_case(binary: str, case: TestCase) -> CommandResult:
    tmpdir = tempfile.mkdtemp(prefix="droid_test_")
    try:
        db_path = os.path.join(tmpdir, "test.db")

        # Session 1: setup
        for cmd in case.setup_commands:
            run_command(binary, "", cli_args=["--db", db_path, "-c", cmd])

        # Session 2: verify
        exit_code, stdout, stderr, timed_out = run_command(
            binary, "", cli_args=["--db", db_path, "-c", case.verify_command],
        )
        actual_text = f"{stdout}{stderr}"

        if timed_out:
            return CommandResult(
                stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
                cli_args=["--db", "..."], case_name=case.name,
                case_header=case.header, case_description=case.description,
                test_input=case.verify_command, expected=case.expected,
                stdout=stdout, stderr=stderr, exit_code=exit_code,
                timed_out=True, passed=False, reason="Command timed out",
            )

        missing = [s for s in case.must_contain if s not in actual_text]
        unwanted = [s for s in case.must_not_contain if s in actual_text]
        passed = len(missing) == 0 and len(unwanted) == 0
        reasons = []
        for s in missing:
            reasons.append(f"Missing in output: '{s}'")
        for s in unwanted:
            reasons.append(f"Should not be in output: '{s}'")

        return CommandResult(
            stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
            cli_args=["--db", "..."], case_name=case.name,
            case_header=case.header, case_description=case.description,
            test_input=case.verify_command, expected=case.expected,
            stdout=stdout, stderr=stderr, exit_code=exit_code,
            timed_out=False, passed=passed, reason="; ".join(reasons),
        )
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


def run_suite(binaries: Iterable[str]) -> list[CommandResult]:
    results: list[CommandResult] = []
    for binary in binaries:
        for case in CASES:
            print(f"[RUN] binary={binary} case={case.name}", flush=True)
            if case.is_multi_session:
                results.append(_run_multi_case(binary, case))
            else:
                results.append(_run_single_case(binary, case))
    clean_db_files()
    return results
