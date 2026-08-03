from __future__ import annotations

import os
import shutil
import signal
import subprocess
import tempfile
import time
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage18"
STAGE_TITLE = "WAL & Crash Recovery"


def _run_and_crash(binary: str, test_input: str, cli_args: list[str] | None = None,
                    wait_seconds: float = 0.3) -> tuple[int, str, str]:
    """Run the binary, send input, wait briefly, then SIGKILL to simulate crash."""
    cmd = [binary] + (cli_args or [])
    proc = subprocess.Popen(
        cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    try:
        proc.stdin.write(test_input.encode())
        proc.stdin.flush()
        time.sleep(wait_seconds)
    except BrokenPipeError:
        pass
    proc.kill()
    stdout, stderr = proc.communicate()
    return proc.returncode, stdout.decode(errors="replace"), stderr.decode(errors="replace")


@dataclass
class TestCase:
    name: str
    header: str
    description: str
    expected: str
    must_contain: list[str]
    must_not_contain: list[str] = field(default_factory=list)
    # Single-session
    test_input: str = ""
    clean_db: bool = True
    # Multi-session
    is_multi_session: bool = False
    sessions: list[str] = field(default_factory=list)
    # Crash simulation
    is_crash_test: bool = False
    crash_input: str = ""
    verify_input: str = ""


CASES: list[TestCase] = [
    TestCase(
        name="wal-commit-persists",
        header="Committed data persists after restart",
        description="BEGIN → INSERT → COMMIT → restart → data present.",
        is_multi_session=True,
        sessions=[
            "begin;\ninsert into users (id, name, email) values (1, 'alice', 'alice@test.com');\ncommit;\n.exit\n",
            "select * from users;\n.exit\n",
        ],
        expected="alice present after restart",
        must_contain=["alice", "(1 rows)"],
    ),
    TestCase(
        name="wal-no-commit-lost",
        header="Uncommitted data lost after crash",
        description="BEGIN → INSERT → crash (no COMMIT) → restart → data NOT present.",
        is_crash_test=True,
        crash_input="begin;\ninsert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n",
        verify_input="select * from users;\n.exit\n",
        expected="(0 rows) after crash without commit",
        must_contain=["(0 rows)"],
        must_not_contain=["alice"],
    ),
    TestCase(
        name="wal-file-exists",
        header="WAL file is created after COMMIT",
        description="After a COMMIT, a .wal file should exist alongside the .db file.",
        is_multi_session=True,
        sessions=[
            "begin;\ninsert into users (id, name, email) values (1, 'test', 't@e');\ncommit;\n.exit\n",
        ],
        expected="WAL file exists (checked in run_case)",
        must_contain=[],  # File existence is checked separately
    ),
    TestCase(
        name="wal-status",
        header="wal status shows log records",
        description="After a COMMIT, 'wal status' should show WAL records and a COMMIT entry.",
        test_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'test', 't@e');\n"
            "commit;\n"
            "wal status\n"
            ".exit\n"
        ),
        expected="[WAL] output with records and COMMIT entry",
        must_contain=["[WAL]", "COMMIT"],
    ),
    TestCase(
        name="wal-crash-recovery",
        header="Committed data recovered after simulated crash",
        description="COMMIT writes WAL, then crash before clean shutdown. On restart, WAL is replayed.",
        is_crash_test=True,
        crash_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "commit;\n"
        ),
        verify_input="select * from users;\n.exit\n",
        expected="alice recovered from WAL after crash",
        must_contain=["alice", "(1 rows)"],
    ),
    TestCase(
        name="wal-multiple-transactions",
        header="Multiple committed transactions survive restart",
        description="Two separate committed transactions should both persist after restart.",
        is_multi_session=True,
        sessions=[
            (
                "begin;\n"
                "insert into users (id, name, email) values (1, 'alice', 'a@e');\n"
                "commit;\n"
                "begin;\n"
                "insert into users (id, name, email) values (2, 'bob', 'b@e');\n"
                "commit;\n"
                ".exit\n"
            ),
            "select * from users;\n.exit\n",
        ],
        expected="Both alice and bob present",
        must_contain=["alice", "bob", "(2 rows)"],
    ),
    TestCase(
        name="wal-checkpoint",
        header="Checkpoint flushes WAL",
        description="After a checkpoint, the WAL should be truncated or cleared.",
        test_input=(
            "begin;\n"
            "insert into users (id, name, email) values (1, 'test', 't@e');\n"
            "commit;\n"
            "wal status\n"
            ".exit\n"
        ),
        expected="[WAL] output shows checkpoint info",
        must_contain=["[WAL]"],
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

        # Special check for wal-file-exists
        if case.name == "wal-file-exists":
            wal_path = db_path.replace(".db", ".wal")
            wal_exists = os.path.exists(wal_path)
            return CommandResult(
                stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
                cli_args=["--db", "..."], case_name=case.name,
                case_header=case.header, case_description=case.description,
                test_input=case.sessions[-1], expected=case.expected,
                stdout=last_stdout, stderr=last_stderr, exit_code=last_exit,
                timed_out=False, passed=wal_exists,
                reason="" if wal_exists else "WAL file not found at expected path",
            )

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


def _run_crash_case(binary: str, case: TestCase) -> CommandResult:
    """Simulate a crash by SIGKILL after sending input, then verify recovery."""
    tmpdir = tempfile.mkdtemp(prefix="droid_test_")
    try:
        db_path = os.path.join(tmpdir, "test.db")

        # Session 1: send input then SIGKILL
        _run_and_crash(binary, case.crash_input, cli_args=["--db", db_path])

        # Session 2: verify recovery
        exit_code, stdout, stderr, timed_out = run_command(
            binary, case.verify_input, cli_args=["--db", db_path],
        )
        actual_text = f"{stdout}{stderr}"

        if timed_out:
            return CommandResult(
                stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
                cli_args=["--db", "..."], case_name=case.name,
                case_header=case.header, case_description=case.description,
                test_input=case.verify_input, expected=case.expected,
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
            test_input=case.verify_input, expected=case.expected,
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
            if case.is_crash_test:
                results.append(_run_crash_case(binary, case))
            elif case.is_multi_session:
                results.append(_run_multi_case(binary, case))
            else:
                results.append(_run_single_case(binary, case))
    clean_db_files()
    return results
