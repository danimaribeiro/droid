from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage15"
STAGE_TITLE = "Schema Validation from Catalog"

# All tests in this stage create the table first, then test validation behavior.
_CREATE_USERS = "create table users (id int, name varchar, email varchar);\n"


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


CASES: list[TestCase] = [
    TestCase(
        name="validate-table-not-exists",
        header="INSERT into unknown table returns error",
        description="Inserting into a table that was never created should fail with a table-not-found error.",
        test_input="insert into unknown_table (id) values (1);\n.exit\n",
        expected="Error: table not found",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="validate-wrong-column-count",
        header="INSERT with wrong number of values returns error",
        description="Inserting 2 values into a 3-column table should fail.",
        test_input=(
            _CREATE_USERS
            + "insert into users (id, name, email) values (1, 'test');\n"
            + ".exit\n"
        ),
        expected="Error: column count mismatch",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="validate-wrong-column-name",
        header="INSERT with unknown column name returns error",
        description="Using a column name not in the table schema should fail.",
        test_input=(
            _CREATE_USERS
            + "insert into users (id, username, email) values (1, 'test', 'test@e.com');\n"
            + ".exit\n"
        ),
        expected="Error: unknown column 'username'",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="validate-type-mismatch",
        header="INSERT with wrong type returns error",
        description="Inserting a string where an INT is expected should fail.",
        test_input=(
            _CREATE_USERS
            + "insert into users (id, name, email) values ('abc', 'test', 'test@e.com');\n"
            + ".exit\n"
        ),
        expected="Error: type mismatch on id column",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="validate-select-unknown-table",
        header="SELECT from unknown table returns error",
        description="Selecting from a table that doesn't exist should fail.",
        test_input="select * from unknown_table;\n.exit\n",
        expected="Error: table not found",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="validate-where-unknown-column",
        header="WHERE on unknown column returns error",
        description="Using a non-existent column in WHERE should fail.",
        test_input=(
            _CREATE_USERS
            + "insert into users (id, name, email) values (1, 'test', 'test@e.com');\n"
            + "select * from users where unknown_col = 1;\n"
            + ".exit\n"
        ),
        expected="Error: unknown column in WHERE",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="validate-correct-insert",
        header="Correct INSERT passes validation",
        description="A well-formed INSERT that matches the catalog schema should succeed.",
        test_input=(
            _CREATE_USERS
            + "insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n"
            + "select * from users;\n"
            + ".exit\n"
        ),
        expected="No errors, data in SELECT output",
        must_contain=["danimar", "(1 rows)"],
        must_not_contain=["[ERROR:"],
    ),
]


def run_case(binary: str, case: TestCase) -> CommandResult:
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


def run_suite(binaries: Iterable[str]) -> list[CommandResult]:
    results: list[CommandResult] = []
    for binary in binaries:
        for case in CASES:
            print(f"[RUN] binary={binary} case={case.name}", flush=True)
            results.append(run_case(binary, case))
    clean_db_files()
    return results
