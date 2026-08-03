from __future__ import annotations
from dataclasses import dataclass, field
from typing import Iterable
from utils import CommandResult, clean_db_files, run_command

STAGE_ID = "stage9"
STAGE_TITLE = "B-Tree Internal Node Splits"

def _generate_inserts(n: int) -> str:
    lines = []
    for i in range(1, n + 1):
        lines.append(f"insert into users (id, name, email) values ({i}, 'user{i}', 'user{i}@test.com');")
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
        name="internal-node-overflow",
        header="Internal node splits on overflow",
        description="Insert enough sequential records to overflow the root internal node.",
        test_input=_generate_inserts(1000) + "btree structure\n.exit\n",
        expected="Tree depth: 3",
        must_contain=["Tree depth: 3", "INTERNAL", "LEAF"],
        must_not_contain=["segmentation fault", "ERROR"],
    ),
    TestCase(
        name="select-after-internal-split",
        header="Full table scan across deep tree",
        description="A full table scan still retrieves all rows sequentially across all leaf pages after the tree has grown to depth 3.",
        test_input=_generate_inserts(1500) + "select * from users;\n.exit\n",
        expected="(1500 rows) with all records intact",
        must_contain=["(1500 rows)", "id=1 ", "id=1500 "],
        must_not_contain=["segmentation fault", "ERROR"],
    ),
    TestCase(
        name="btree-find-deep-tree",
        header="B+Tree find in deep tree",
        description="B+Tree find correctly cascades down multiple levels of internal nodes to locate the exact leaf cell.",
        test_input=_generate_inserts(2000) + "btree find 1500\nbtree find 2005\n.exit\n",
        expected="FOUND key=1500 and NOT_FOUND key=2005",
        must_contain=["Find key=1500: FOUND", "Find key=2005: NOT_FOUND"],
        must_not_contain=["segmentation fault", "ERROR"],
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
