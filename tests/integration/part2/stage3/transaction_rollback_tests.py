from __future__ import annotations

import os
import shutil
import tempfile
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage17"
STAGE_TITLE = "Transactions: ROLLBACK & Undo Log"


@dataclass
class TestCase:
    name: str
    header: str
    description: str
    expected: str
    must_contain: list[str]
    must_not_contain: list[str] = field(default_factory=list)
    test_input: str = ""
    clean_db: bool = True
    is_multi_session: bool = False
    sessions: list[str] = field(default_factory=list)


CASES: list[TestCase] = [
    TestCase(
        name="tx-rollback-basic",
        header="ROLLBACK discards inserted data",
        description="After BEGIN → INSERT → ROLLBACK, the data should not be present.",
        test_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "rollback;\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="(0 rows) after rollback",
        must_contain=["(0 rows)"],
        must_not_contain=["alice"],
    ),
    TestCase(
        name="tx-rollback-multiple",
        header="ROLLBACK discards all inserts in transaction",
        description="Multiple INSERTs followed by ROLLBACK should all be discarded.",
        test_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'alice', 'a@e');\n"
            "insert into users (id, name, email) values (2, 'bob', 'b@e');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'c@e');\n"
            "rollback;\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="(0 rows) — all 3 inserts rolled back",
        must_contain=["(0 rows)"],
        must_not_contain=["alice", "bob", "charlie"],
    ),
    TestCase(
        name="tx-rollback-then-commit",
        header="ROLLBACK then new COMMIT works",
        description="After rolling back, a new transaction can INSERT and COMMIT successfully.",
        test_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'alice', 'a@e');\n"
            "rollback;\n"
            "begin;\n"
            "insert into users (id, name, email) values (2, 'bob', 'b@e');\n"
            "commit;\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="Only bob present (alice was rolled back)",
        must_contain=["bob", "(1 rows)"],
        must_not_contain=["alice"],
    ),
    TestCase(
        name="tx-rollback-no-begin-error",
        header="ROLLBACK without BEGIN returns error",
        description="Rolling back without an active transaction should produce an error.",
        test_input="rollback;\n.exit\n",
        expected="Error: no active transaction",
        must_contain=["ERROR"],
    ),
    TestCase(
        name="tx-committed-data-survives-rollback",
        header="Previously committed data is not affected by ROLLBACK",
        description="Data from a committed transaction should survive a subsequent ROLLBACK.",
        test_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'alice', 'a@e');\n"
            "commit;\n"
            "begin;\n"
            "insert into users (id, name, email) values (2, 'bob', 'b@e');\n"
            "rollback;\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="alice present (committed), bob absent (rolled back)",
        must_contain=["alice", "(1 rows)"],
        must_not_contain=["bob"],
    ),
    TestCase(
        name="tx-rollback-select-empty",
        header="SELECT after ROLLBACK shows empty table",
        description="After inserting in a transaction and rolling back, SELECT returns 0 rows.",
        is_multi_session=True,
        expected="(0 rows) in session 2 after rollback in session 1",
        sessions=[
            "begin;\ninsert into users (id, name, email) values (1, 'test', 't@e');\nrollback;\n.exit\n",
            "select * from users;\n.exit\n",
        ],
        must_contain=["(0 rows)"],
    ),
    TestCase(
        name="tx-undo-page-restore",
        header="B-tree is restored after ROLLBACK",
        description="After INSERT + ROLLBACK, btree dump should show the node in its pre-transaction state.",
        test_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'test', 't@e');\n"
            "rollback;\n"
            "btree dump 0\n"
            ".exit\n"
        ),
        expected="num_cells=0 after rollback (empty tree)",
        must_contain=["num_cells=0"],
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
        last_stdout = last_stderr = ""
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
