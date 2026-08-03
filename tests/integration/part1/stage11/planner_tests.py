from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage10"
STAGE_TITLE = "Query Planner & Executor (Volcano Model)"


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


# ---------------------------------------------------------------------------
# explain command: verify the planner picks the right plan node
# ---------------------------------------------------------------------------

CASES: list[TestCase] = [
    # --- Plan choice tests (explain) ---
    TestCase(
        name="explain-select-seqscan",
        header="SELECT without WHERE plans a SeqScan",
        description="A SELECT with no WHERE clause must use a sequential scan over all leaf pages.",
        test_input="explain select * from users;\n.exit\n",
        expected="[PLAN] with SeqScan node",
        must_contain=["[PLAN]", "SeqScan", "table=users"],
        must_not_contain=["IndexScan"],
        clean_db=False,
    ),
    TestCase(
        name="explain-select-indexscan",
        header="SELECT with WHERE id=N plans an IndexScan",
        description="When the WHERE clause filters on the primary key (id), the planner should choose an IndexScan using the B-tree.",
        test_input="explain select * from users where id = 2;\n.exit\n",
        expected="[PLAN] with IndexScan node and key=2",
        must_contain=["[PLAN]", "IndexScan", "key=2"],
        must_not_contain=["SeqScan"],
        clean_db=False,
    ),
    TestCase(
        name="explain-select-seqscan-filter",
        header="SELECT with WHERE on non-key column plans a SeqScan with filter",
        description="WHERE on 'name' cannot use the B-tree index, so the planner falls back to SeqScan with a filter.",
        test_input="explain select * from users where name = 'alice';\n.exit\n",
        expected="[PLAN] with SeqScan and filter on name",
        must_contain=["[PLAN]", "SeqScan", "filter:"],
        must_not_contain=["IndexScan"],
        clean_db=False,
    ),
    TestCase(
        name="explain-insert",
        header="INSERT plans an Insert node",
        description="An INSERT statement should produce an Insert plan node.",
        test_input="explain insert into users (id, name, email) values (1, 'test', 'test@t.com');\n.exit\n",
        expected="[PLAN] with Insert node",
        must_contain=["[PLAN]", "Insert", "table=users"],
        clean_db=False,
    ),

    # --- End-to-end: explain + execute in same session ---
    TestCase(
        name="indexscan-end-to-end",
        header="IndexScan: correct plan and correct result",
        description="Explain shows IndexScan, then executing the same query returns only the matching row.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');\n"
            "explain select * from users where id = 2;\n"
            "select * from users where id = 2;\n"
            ".exit\n"
        ),
        expected="IndexScan in plan + only bob in result",
        must_contain=["IndexScan", "bob", "(1 rows)"],
        must_not_contain=["alice", "charlie"],
    ),
    TestCase(
        name="seqscan-filter-end-to-end",
        header="SeqScan with filter: correct plan and correct result",
        description="Explain shows SeqScan (non-key filter), then executing returns the correct row.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');\n"
            "explain select * from users where name = 'bob';\n"
            "select * from users where name = 'bob';\n"
            ".exit\n"
        ),
        expected="SeqScan in plan + only bob in result",
        must_contain=["SeqScan", "filter:", "bob", "(1 rows)"],
        must_not_contain=["IndexScan"],
    ),
    TestCase(
        name="seqscan-full-scan-end-to-end",
        header="SeqScan full scan: correct plan and all rows returned",
        description="SELECT without WHERE should plan a SeqScan and return all inserted rows.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "explain select * from users;\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="SeqScan in plan + both rows in result",
        must_contain=["SeqScan", "alice", "bob", "(2 rows)"],
        must_not_contain=["IndexScan"],
    ),
    TestCase(
        name="explain-syntax-error",
        header="Explain with invalid SQL returns error",
        description="Malformed SQL after explain should produce a parser error.",
        test_input="explain select from;\n.exit\n",
        expected="Error code in output",
        must_contain=["[ERROR:"],
        clean_db=False,
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
