from __future__ import annotations

import os
import shutil
import tempfile
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage16"
STAGE_TITLE = "Transactions: BEGIN / COMMIT"


@dataclass
class TestCase:
    name: str
    header: str
    description: str
    expected: str
    must_contain: list[str]
    must_not_contain: list[str] = field(default_factory=list)
    # Single-session fields
    test_input: str = ""
    clean_db: bool = True
    # Multi-session fields
    is_multi_session: bool = False
    sessions: list[str] = field(default_factory=list)  # list of stdin inputs per session


CASES: list[TestCase] = [
    TestCase(
        name="tx-auto-commit",
        header="INSERT without BEGIN persists (auto-commit)",
        description="Without explicit BEGIN, each statement auto-commits and data should persist across sessions.",
        is_multi_session=True,
        expected="Data persists without explicit transaction",
        sessions=[
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n.exit\n",
            "select * from users;\n.exit\n",
        ],
        must_contain=["alice", "(1 rows)"],
    ),
    TestCase(
        name="tx-begin-commit",
        header="BEGIN + COMMIT makes data persistent",
        description="Data inserted within a BEGIN/COMMIT block should persist across sessions.",
        is_multi_session=True,
        expected="Committed data persists",
        sessions=[
            "begin;\ninsert into users (id, name, email) values (1, 'alice', 'alice@test.com');\ncommit;\n.exit\n",
            "select * from users;\n.exit\n",
        ],
        must_contain=["alice", "(1 rows)"],
    ),
    TestCase(
        name="tx-begin-no-commit",
        header="BEGIN without COMMIT loses data",
        description="If a transaction is started but not committed before exit, data should be lost.",
        is_multi_session=True,
        expected="Uncommitted data is lost",
        sessions=[
            "begin;\ninsert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n.exit\n",
            "select * from users;\n.exit\n",
        ],
        must_contain=["(0 rows)"],
        must_not_contain=["alice"],
    ),
    TestCase(
        name="tx-multiple-inserts",
        header="Multiple INSERTs in one transaction all persist",
        description="All INSERTs between BEGIN and COMMIT should be durable.",
        is_multi_session=True,
        expected="All 3 committed rows persist",
        sessions=[
            (
                "begin;\n"
                "insert into users (id, name, email) values (1, 'alice', 'a@e');\n"
                "insert into users (id, name, email) values (2, 'bob', 'b@e');\n"
                "insert into users (id, name, email) values (3, 'charlie', 'c@e');\n"
                "commit;\n"
                ".exit\n"
            ),
            "select * from users;\n.exit\n",
        ],
        must_contain=["alice", "bob", "charlie", "(3 rows)"],
    ),
    TestCase(
        name="tx-nested-begin-error",
        header="Nested BEGIN returns error",
        description="Starting a transaction when one is already active should produce an error.",
        test_input="begin;\nbegin;\n.exit\n",
        expected="Error on nested BEGIN",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="tx-commit-no-begin-error",
        header="COMMIT without BEGIN returns error",
        description="Committing without an active transaction should produce an error.",
        test_input="commit;\n.exit\n",
        expected="Error on COMMIT without BEGIN",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="tx-select-in-transaction",
        header="SELECT within transaction sees uncommitted data",
        description="Within a transaction, SELECT should see the data inserted so far (read-your-writes).",
        test_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "select * from users;\n"
            "commit;\n"
            ".exit\n"
        ),
        expected="alice visible in SELECT within transaction",
        must_contain=["alice", "(1 rows)"],
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

        # Run all sessions sequentially
        last_stdout = ""
        last_stderr = ""
        last_exit = 0
        last_timed_out = False
        for session_input in case.sessions:
            last_exit, last_stdout, last_stderr, last_timed_out = run_command(
                binary, session_input, cli_args=["--db", db_path],
            )

        actual_text = f"{last_stdout}{last_stderr}"

        if last_timed_out:
            return CommandResult(
                stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
                cli_args=["--db", "..."], case_name=case.name,
                case_header=case.header, case_description=case.description,
                test_input=case.sessions[-1], expected=case.expected,
                stdout=last_stdout, stderr=last_stderr, exit_code=last_exit,
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
            test_input=case.sessions[-1], expected=case.expected,
            stdout=last_stdout, stderr=last_stderr, exit_code=last_exit,
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
