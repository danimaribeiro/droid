from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage13"
STAGE_TITLE = "B-Tree with Variable-Length Cells"


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
        name="varlen-btree-cell-sizes",
        header="Cell sizes differ for different row sizes",
        description="Inserting rows with different name/email lengths should produce cells of different sizes in btree dump.",
        test_input=(
            "insert into users (id, name, email) values (1, 'a', 'b');\n"
            "insert into users (id, name, email) values (2, 'a-long-name-here', 'a-long-email-here@example.com');\n"
            "btree dump 0\n"
            ".exit\n"
        ),
        expected="Cell byte sizes differ in dump",
        must_contain=["Cell 0:", "Cell 1:", "bytes)"],
    ),
    TestCase(
        name="varlen-btree-more-cells",
        header="Small rows fit more cells per leaf than Part 1",
        description="With small variable-length rows, a leaf page should hold more than 7 cells (Part 1 limit).",
        test_input=(
            "".join(
                f"insert into users (id, name, email) values ({i}, 'u{i}', '{i}@e');\n"
                for i in range(1, 16)
            )
            + "btree dump 0\n"
            + ".exit\n"
        ),
        expected="num_cells >= 15 (all fit in one page with small rows)",
        must_contain=["num_cells=15"],
        must_not_contain=["INTERNAL"],  # No split needed for 15 small rows
    ),
    TestCase(
        name="varlen-btree-find",
        header="btree find returns correct variable-length data",
        description="After inserting a variable-length row, btree find should return the correct field values.",
        test_input=(
            "insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n"
            "btree find 1\n"
            ".exit\n"
        ),
        expected="FOUND with correct row data",
        must_contain=["Find key=1: FOUND", "danimar", "danimar@email.com"],
    ),
    TestCase(
        name="varlen-btree-sorted",
        header="Keys are stored in sorted order",
        description="Inserting keys out of order should still produce sorted cells in the dump.",
        test_input=(
            "insert into users (id, name, email) values (3, 'charlie', 'c@e');\n"
            "insert into users (id, name, email) values (1, 'alice', 'a@e');\n"
            "insert into users (id, name, email) values (2, 'bob', 'b@e');\n"
            "btree dump 0\n"
            ".exit\n"
        ),
        expected="Cells in key order: 1, 2, 3",
        must_contain=["Cell 0: key=1", "Cell 1: key=2", "Cell 2: key=3"],
    ),
    TestCase(
        name="varlen-btree-split-small-rows",
        header="Many small rows before split",
        description="Small variable-length rows should fit more than 7 per page before triggering a split.",
        test_input=(
            "".join(
                f"insert into users (id, name, email) values ({i}, 'u{i}', '{i}@e');\n"
                for i in range(1, 51)
            )
            + "btree structure\n"
            + ".exit\n"
        ),
        expected="Tree depth > 1 (split occurred) with many cells per leaf",
        must_contain=["LEAF"],
    ),
    TestCase(
        name="varlen-btree-split-large-rows",
        header="Few large rows trigger split quickly",
        description="Large rows (long names) should fill a page with fewer cells, triggering an earlier split.",
        test_input=(
            "".join(
                f"insert into users (id, name, email) values ({i}, '{'x' * 200}', '{'y' * 200}');\n"
                for i in range(1, 11)
            )
            + "btree structure\n"
            + ".exit\n"
        ),
        expected="Split after fewer rows than the small-row test",
        must_contain=["INTERNAL", "LEAF"],
    ),
    TestCase(
        name="varlen-btree-structure",
        header="Tree depth increases on split",
        description="After enough insertions to trigger a split, tree depth should be > 1.",
        test_input=(
            "".join(
                f"insert into users (id, name, email) values ({i}, 'user{i}', 'user{i}@test.com');\n"
                for i in range(1, 31)
            )
            + "btree structure\n"
            + ".exit\n"
        ),
        expected="Tree depth: 2 or more",
        must_contain=["Tree depth:", "INTERNAL", "LEAF"],
    ),
    TestCase(
        name="varlen-btree-select-all",
        header="SELECT returns all variable-length rows",
        description="After inserting rows of various sizes, SELECT should return all with correct data.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'alice@test.com');\n"
            "insert into users (id, name, email) values (2, 'bob', 'bob@test.com');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'charlie@test.com');\n"
            "select * from users;\n"
            ".exit\n"
        ),
        expected="All 3 rows in output with (3 rows)",
        must_contain=["alice", "bob", "charlie", "(3 rows)"],
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

    # Custom: verify cell sizes actually differ for varlen-btree-cell-sizes
    if case.name == "varlen-btree-cell-sizes" and passed:
        sizes = [int(m.group(1)) for m in re.finditer(r"\((\d+) bytes\)", actual_text)]
        if len(sizes) >= 2 and len(set(sizes)) == 1:
            passed = False
            reasons.append(f"Cell sizes should differ but all are {sizes[0]}")

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
