from __future__ import annotations

import os
import shutil
import tempfile
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage9"
STAGE_TITLE = "Persistence & WHERE Clause"


# ---------------------------------------------------------------------------
# Single-session test cases (WHERE clause) — use REPL mode with clean DB
# ---------------------------------------------------------------------------

@dataclass
class SingleSessionCase:
    name: str
    header: str
    description: str
    test_input: str
    expected: str
    must_contain: list[str]
    must_not_contain: list[str] = field(default_factory=list)
    clean_db: bool = True


SINGLE_CASES: list[SingleSessionCase] = [
    SingleSessionCase(
        name="where-equals-int",
        header="SELECT with WHERE id = N returns matching row",
        description="After inserting 3 rows, selecting with WHERE id = 2 should return only that row.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');\n"
            "select * from users where id = 2;\n"
            ".exit\n"
        ),
        expected="Only row with id=2 (bob) returned",
        must_contain=["bob", "(1 rows)"],
        must_not_contain=["alice", "charlie"],
    ),
    SingleSessionCase(
        name="where-no-match",
        header="SELECT with WHERE returns zero rows when no match",
        description="Selecting with WHERE id = 99 should return 0 rows.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "select * from users where id = 99;\n"
            ".exit\n"
        ),
        expected="(0 rows) in output",
        must_contain=["(0 rows)"],
    ),
    SingleSessionCase(
        name="where-equals-string",
        header="SELECT with WHERE on string column",
        description="Selecting with WHERE name = 'alice' should return only that row.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');\n"
            "select * from users where name = 'alice';\n"
            ".exit\n"
        ),
        expected="Only row with name='alice' returned",
        must_contain=["alice", "(1 rows)"],
        must_not_contain=["bob", "charlie"],
    ),
]


# ---------------------------------------------------------------------------
# Multi-session test cases (persistence) — use -c mode with --db <tmpfile>
# ---------------------------------------------------------------------------

@dataclass
class MultiSessionCase:
    name: str
    header: str
    description: str
    setup_commands: list[str]
    verify_command: str
    expected: str
    must_contain: list[str]
    must_not_contain: list[str] = field(default_factory=list)


MULTI_CASES: list[MultiSessionCase] = [
    MultiSessionCase(
        name="persist-insert-reopen",
        header="Inserted row persists across sessions",
        description="Insert a row in session 1, close, reopen in session 2, and SELECT should return it.",
        setup_commands=[
            "insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');",
        ],
        verify_command="select * from users;",
        expected="Row from session 1 appears in session 2",
        must_contain=["danimar", "(1 rows)"],
    ),
    MultiSessionCase(
        name="persist-multiple-rows",
        header="Multiple inserted rows persist across sessions",
        description="Insert 3 rows in session 1, verify all 3 appear in session 2.",
        setup_commands=[
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');",
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');",
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');",
        ],
        verify_command="select * from users;",
        expected="All 3 rows present in session 2",
        must_contain=["alice", "bob", "charlie", "(3 rows)"],
    ),
    MultiSessionCase(
        name="persist-find-after-reopen",
        header="B-tree find works after reopen",
        description="Insert a row, close, reopen, and 'btree find 1' should return FOUND.",
        setup_commands=[
            "insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');",
        ],
        verify_command="btree find 1",
        expected="FOUND after reopen",
        must_contain=["Find key=1: FOUND", "danimar"],
    ),
    MultiSessionCase(
        name="persist-db-isolation",
        header="Separate --db files are isolated",
        description="Insert into db1 should not appear when querying db2.",
        # This is handled specially in run_multi_case
        setup_commands=[
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');",
        ],
        verify_command="select * from users;",
        expected="Empty result because db2 is a different file",
        must_contain=["(0 rows)"],
        must_not_contain=["alice"],
    ),
    MultiSessionCase(
        name="persist-db-flag-missing-value",
        header="--db without path argument returns error",
        description="Running with --db but no path should produce an error and non-zero exit.",
        setup_commands=[],
        verify_command="",  # Not used — we test the --db flag directly
        expected="Error message and non-zero exit code",
        must_contain=["ERROR"],
    ),
]


def _run_single_case(binary: str, case: SingleSessionCase) -> CommandResult:
    """Run a single-session test case (WHERE clause tests)."""
    if case.clean_db:
        clean_db_files()

    exit_code, stdout, stderr, timed_out = run_command(
        binary=binary,
        test_input=case.test_input,
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


def _run_multi_case(binary: str, case: MultiSessionCase) -> CommandResult:
    """Run a multi-session persistence test case using --db with a temp file."""

    # Special case: test --db without a value
    if case.name == "persist-db-flag-missing-value":
        exit_code, stdout, stderr, timed_out = run_command(
            binary=binary, test_input="", cli_args=["--db"],
        )
        actual_text = f"{stdout}{stderr}"
        # Expect non-zero exit OR error in output
        has_error = "ERROR" in actual_text or "[ERROR:" in actual_text or exit_code != 0
        return CommandResult(
            stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
            cli_args=["--db"], case_name=case.name, case_header=case.header,
            case_description=case.description, test_input="",
            expected=case.expected, stdout=stdout, stderr=stderr,
            exit_code=exit_code, timed_out=timed_out,
            passed=has_error,
            reason="" if has_error else "Expected error or non-zero exit for --db without path",
        )

    tmpdir = tempfile.mkdtemp(prefix="droid_test_")
    try:
        db_path = os.path.join(tmpdir, "test.db")

        # Special case: db isolation uses TWO different db files
        if case.name == "persist-db-isolation":
            db_path_1 = os.path.join(tmpdir, "db1.db")
            db_path_2 = os.path.join(tmpdir, "db2.db")

            # Session 1: insert into db1
            for cmd in case.setup_commands:
                run_command(binary, "", cli_args=["--db", db_path_1, "-c", cmd])

            # Session 2: query db2 (different file)
            exit_code, stdout, stderr, timed_out = run_command(
                binary, "", cli_args=["--db", db_path_2, "-c", case.verify_command],
            )
        else:
            # Session 1: run all setup commands
            for cmd in case.setup_commands:
                run_command(binary, "", cli_args=["--db", db_path, "-c", cmd])

            # Session 2: run verify command
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
        for case in SINGLE_CASES:
            print(f"[RUN] binary={binary} case={case.name}", flush=True)
            results.append(_run_single_case(binary, case))
        for case in MULTI_CASES:
            print(f"[RUN] binary={binary} case={case.name}", flush=True)
            results.append(_run_multi_case(binary, case))
    clean_db_files()
    return results
