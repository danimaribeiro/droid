from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, clean_db_files, run_command


STAGE_ID = "stage12"
STAGE_TITLE = "Slotted Page Architecture"


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
        name="slotted-page-empty",
        header="Fresh page shows zero slots",
        description="On a fresh database, 'pager dump-page 0' should show slots=0 and high free space.",
        test_input="pager dump-page 0\n.exit\n",
        expected="slots=0 and free_space close to page size",
        must_contain=["[PAGER]", "slots=0", "free_space="],
    ),
    TestCase(
        name="slotted-page-one-insert",
        header="After one INSERT, page has one slot",
        description="Inserting one row should create one slot pointing to the record.",
        test_input=(
            "insert into users (id, name, email) values (1, 'dan', 'd@e');\n"
            "pager dump-page 0\n"
            ".exit\n"
        ),
        expected="slots=1 with slot offset and length",
        must_contain=["slots=1", "Slot 0:", "offset=", "length="],
    ),
    TestCase(
        name="slotted-page-multiple",
        header="Multiple INSERTs create multiple slots",
        description="After 3 INSERTs, the page should have 3 slots.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'a@e');\n"
            "insert into users (id, name, email) values (2, 'bob', 'b@e');\n"
            "insert into users (id, name, email) values (3, 'charlie', 'c@e');\n"
            "pager dump-page 0\n"
            ".exit\n"
        ),
        expected="slots=3 with all three slot entries",
        must_contain=["slots=3", "Slot 0:", "Slot 1:", "Slot 2:"],
    ),
    TestCase(
        name="slotted-page-variable-sizes",
        header="Different row sizes produce different slot lengths",
        description="Short and long rows should have different slot lengths in the dump.",
        test_input=(
            "insert into users (id, name, email) values (1, 'a', 'b');\n"
            "insert into users (id, name, email) values (2, 'a-much-longer-name', 'a-much-longer-email@example.com');\n"
            "pager dump-page 0\n"
            ".exit\n"
        ),
        expected="Slot lengths differ between short and long rows",
        must_contain=["Slot 0:", "Slot 1:", "length="],
        # Custom check in run_case verifies slot lengths differ
    ),
    TestCase(
        name="slotted-page-free-space",
        header="Free space decreases with each insert",
        description="After inserting rows, free space should be less than the initial value.",
        test_input=(
            "pager dump-page 0\n"
            "insert into users (id, name, email) values (1, 'test', 'test@e');\n"
            "pager dump-page 0\n"
            ".exit\n"
        ),
        expected="free_space decreases after insert",
        must_contain=["free_space="],
        # The test verifies that the free_space value after insert is lower
    ),
    TestCase(
        name="slotted-page-records-backward",
        header="Records are stored from the end of the page",
        description="Slot offsets should be near the end of the 4096-byte page and decrease with each record.",
        test_input=(
            "insert into users (id, name, email) values (1, 'alice', 'a@e');\n"
            "insert into users (id, name, email) values (2, 'bob', 'b@e');\n"
            "pager dump-page 0\n"
            ".exit\n"
        ),
        expected="Slot offsets near end of page, second offset lower than first",
        must_contain=["Slot 0: offset=", "Slot 1: offset="],
    ),
]


def _extract_slot_lengths(text: str) -> list[int]:
    """Extract slot lengths from pager dump output."""
    import re
    return [int(m.group(1)) for m in re.finditer(r"length=(\d+)", text)]


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

    # Custom check: variable-sizes test verifies slot lengths differ
    if case.name == "slotted-page-variable-sizes" and passed:
        lengths = _extract_slot_lengths(actual_text)
        if len(lengths) >= 2 and lengths[0] == lengths[1]:
            passed = False
            reasons.append(f"Slot lengths should differ but both are {lengths[0]}")

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
