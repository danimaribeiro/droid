from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage12"
STAGE_TITLE = "DELETE & UPDATE Execution (Fixed-Size)"


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


CASES = [
    TestCase(
        name="delete-existing-row",
        header="Stage 12: Delete existing row",
        description="Verify DELETE FROM users WHERE id = 2 removes row and updates count",
        test_input="""insert into users (id, name, email) values (1, 'Alice', 'alice@test.com');
insert into users (id, name, email) values (2, 'Bob', 'bob@test.com');
insert into users (id, name, email) values (3, 'Charlie', 'charlie@test.com');
delete from users where id = 2;
select * from users;
.exit
""",
        expected="Delete row id 2 and list remaining",
        must_contain=[
            "Insert statement executed successfully",
            "Delete statement executed successfully",
            "1 | Alice | alice@test.com",
            "3 | Charlie | charlie@test.com",
            "(2 rows)",
        ],
        must_not_contain=["2 | Bob | bob@test.com", "(3 rows)"],
    ),
    TestCase(
        name="delete-non-existing-row",
        header="Stage 12: Delete non-existing row",
        description="Verify error when row is not found",
        test_input="""insert into users (id, name, email) values (1, 'Alice', 'alice@test.com');
delete from users where id = 99;
select * from users;
.exit
""",
        expected="Row not found error",
        must_contain=[
            "Insert statement executed successfully",
            "Error: Row not found",
            "1 | Alice | alice@test.com",
            "(1 rows)",
        ],
    ),
    TestCase(
        name="update-existing-row",
        header="Stage 12: Update existing row",
        description="Verify UPDATE users SET name = 'Alicia' WHERE id = 1",
        test_input="""insert into users (id, name, email) values (1, 'Alice', 'alice@test.com');
update users set name = 'Alicia' where id = 1;
select * from users;
.exit
""",
        expected="Updated row printed with new name",
        must_contain=[
            "Insert statement executed successfully",
            "Update statement executed successfully",
            "1 | Alicia | alice@test.com",
            "(1 rows)",
        ],
        must_not_contain=["1 | Alice | alice@test.com"],
    ),
    TestCase(
        name="update-non-existing-row",
        header="Stage 12: Update non-existing row",
        description="Verify error when row to update is missing",
        test_input="""update users set name = 'Ghost' where id = 99;
.exit
""",
        expected="Error: Row not found",
        must_contain=["Error: Row not found"],
        must_not_contain=["Update statement executed successfully"],
    ),
    TestCase(
        name="delete-multiple-rows-and-verify-btree",
        header="Stage 12: Delete multiple rows and inspect B-Tree",
        description="Verify leaf cell shifting and cell count in btree dump",
        test_input="""insert into users (id, name, email) values (1, 'user1', 'u1@test.com');
insert into users (id, name, email) values (2, 'user2', 'u2@test.com');
insert into users (id, name, email) values (3, 'user3', 'u3@test.com');
insert into users (id, name, email) values (4, 'user4', 'u4@test.com');
delete from users where id = 2;
delete from users where id = 4;
btree dump 0
.exit
""",
        expected="BTree dump shows 2 remaining cells",
        must_contain=[
            "Delete statement executed successfully",
            "[BTREE] Page 0: type=LEAF num_cells=2",
            "[BTREE]   Cell 0: key=1",
            "[BTREE]   Cell 1: key=3",
        ],
        must_not_contain=["Cell 2:", "Cell 3:"],
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
