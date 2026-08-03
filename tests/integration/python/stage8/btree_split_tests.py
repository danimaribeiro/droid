from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage8"
STAGE_TITLE = "B-Tree Splits & Internal Nodes"

# Number of rows to insert to guarantee at least one leaf split.
# With 60-byte rows + 4-byte key = 64 bytes/cell (~63 cells/page, test threshold: 10)
# minus header (~10 bytes), a leaf holds roughly 7 cells.
# Inserting 10 rows will force a split.
SPLIT_THRESHOLD = 10


def _generate_inserts(n: int) -> str:
    """Generate N INSERT statements with sequential ids."""
    lines = []
    for i in range(1, n + 1):
        lines.append(
            f"insert into users (id, name, email) values ({i}, 'user{i}', 'user{i}@test.com');"
        )
    return "\n".join(lines) + "\n"


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
        name="btree-no-split-under-limit",
        header="No split when under leaf capacity",
        description="Inserting a small number of rows should keep the tree at depth 1 (single leaf).",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'a@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'b@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'c@test.com');\n"
            "btree structure\n"
            ".exit\n"
        ),
        expected="Tree depth: 1 with a single LEAF node",
        must_contain=["Tree depth: 1", "LEAF"],
        must_not_contain=["INTERNAL"],
    ),
    TestCase(
        name="btree-split-on-overflow",
        header="Leaf splits when capacity is exceeded",
        description="Inserting enough rows to exceed leaf capacity should increase tree depth to 2.",
        test_input=_generate_inserts(SPLIT_THRESHOLD) + "btree structure\n.exit\n",
        expected="Tree depth: 2 after overflow",
        must_contain=["Tree depth: 2"],
    ),
    TestCase(
        name="btree-internal-node-created",
        header="Internal node is created after split",
        description="After a split, the tree structure should contain an INTERNAL node.",
        test_input=_generate_inserts(SPLIT_THRESHOLD) + "btree structure\n.exit\n",
        expected="INTERNAL node in tree structure",
        must_contain=["INTERNAL"],
    ),
    TestCase(
        name="btree-split-has-two-leaves",
        header="Split produces two leaf nodes",
        description="After a split, the tree should have at least two LEAF nodes.",
        test_input=_generate_inserts(SPLIT_THRESHOLD) + "btree structure\n.exit\n",
        expected="At least two LEAF nodes in structure",
        must_contain=["LEAF"],
        # We check for LEAF appearing; the run_case also counts occurrences below
    ),
    TestCase(
        name="btree-find-after-split",
        header="All keys findable after split",
        description="After inserting enough rows to trigger a split (must limit leaf to <10 rows), every key should still be FOUND.",
        test_input=(
            _generate_inserts(SPLIT_THRESHOLD)
            + "btree structure\n"
            + "btree find 1\n"
            + "btree find 5\n"
            + f"btree find {SPLIT_THRESHOLD}\n"
            + ".exit\n"
        ),
        expected="Tree split into INTERNAL node and all queried keys return FOUND",
        must_contain=[
            "INTERNAL",
            "Find key=1: FOUND",
            "Find key=5: FOUND",
            f"Find key={SPLIT_THRESHOLD}: FOUND",
        ],
    ),
    TestCase(
        name="btree-select-after-split",
        header="SELECT returns all rows after split",
        description="After inserting enough rows to split (must limit leaf to <10 rows), SELECT should return the correct total count.",
        test_input=(
            _generate_inserts(SPLIT_THRESHOLD)
            + "btree structure\n"
            + "select * from users;\n"
            + ".exit\n"
        ),
        expected=f"Tree split into INTERNAL node and ({SPLIT_THRESHOLD} rows) in SELECT output",
        must_contain=["INTERNAL", f"({SPLIT_THRESHOLD} rows)"],
    ),
    TestCase(
        name="btree-insert-order-after-split",
        header="Rows returned in key order after split",
        description="After out-of-order inserts that trigger a split (must limit leaf to <10 rows), SELECT should return rows sorted by key.",
        test_input=(
            # Insert in reverse order to stress the sorting
            "".join(
                f"insert into users (id, name, email) values ({i}, 'user{i}', 'user{i}@test.com');\n"
                for i in range(SPLIT_THRESHOLD, 0, -1)
            )
            + "btree structure\n"
            + "select * from users;\n"
            + ".exit\n"
        ),
        expected="Tree split into INTERNAL node and rows in ascending key order despite reverse insertion",
        must_contain=["INTERNAL", f"({SPLIT_THRESHOLD} rows)"],
        # Ordering is verified by the custom check in run_case
    ),
    TestCase(
        name="btree-multi-split",
        header="Multiple splits create deeper tree",
        description="Inserting many rows should cause multiple splits, resulting in 3+ leaf nodes.",
        test_input=_generate_inserts(SPLIT_THRESHOLD * 3) + "btree structure\n.exit\n",
        expected="Multiple LEAF nodes and INTERNAL structure",
        must_contain=["INTERNAL", "LEAF"],
    ),
]


def _count_occurrences(text: str, substring: str) -> int:
    """Count non-overlapping occurrences of substring in text."""
    count = 0
    start = 0
    while True:
        idx = text.find(substring, start)
        if idx == -1:
            break
        count += 1
        start = idx + len(substring)
    return count


def _check_select_key_order(text: str) -> tuple[bool, str]:
    """Verify that rows in SELECT output appear in ascending id order."""
    import re
    # Match rows like: "1 | user1 | user1@test.com" or "1 | ..."
    # Look for lines starting with a number followed by " | "
    pattern = re.compile(r"^\s*(\d+)\s*\|", re.MULTILINE)
    ids = [int(m.group(1)) for m in pattern.finditer(text)]
    if not ids:
        return False, "No rows found in SELECT output"
    if ids == sorted(ids):
        return True, ""
    return False, f"Rows not in ascending order: {ids[:10]}..."


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

    # Extra check: split-has-two-leaves expects at least 2 LEAF occurrences
    if case.name == "btree-split-has-two-leaves":
        leaf_count = _count_occurrences(actual_text, "LEAF")
        if leaf_count < 2:
            passed = False
            reasons.append(f"Expected at least 2 LEAF nodes, found {leaf_count}")

    # Extra check: insert-order-after-split verifies ascending order
    if case.name == "btree-insert-order-after-split":
        order_ok, order_reason = _check_select_key_order(actual_text)
        if not order_ok:
            passed = False
            reasons.append(order_reason)

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
