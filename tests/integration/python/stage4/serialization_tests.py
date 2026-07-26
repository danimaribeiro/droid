from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, run_command


STAGE_ID = "stage4"
STAGE_TITLE = "Row Serialization"


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


CASES: list[TestCase] = [
    TestCase(
        name="serialize-valid-insert",
        header="Valid INSERT produces serialized row output",
        description="Checks that 'serialize insert into users ...' outputs [SERIALIZE] block with Row Size, fields, and Round-trip OK.",
        test_input="serialize insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n.exit\n",
        expected="[SERIALIZE] block with Row Size: 508, field lines, Round-trip: OK",
        must_contain=[
            "[SERIALIZE] Row Size: 508",
            "[SERIALIZE] Round-trip: OK",
        ],
    ),
    TestCase(
        name="serialize-fields-present",
        header="Serialized output shows all field values",
        description="Checks that id, name, and email field lines appear in the serialize output.",
        test_input="serialize insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n.exit\n",
        expected="All three [SERIALIZE] Field lines with correct values",
        must_contain=[
            "[SERIALIZE] Field id = 1",
            "[SERIALIZE] Field name =",
            "danimar",
            "[SERIALIZE] Field email =",
            "danimar@email.com",
        ],
    ),
    TestCase(
        name="serialize-zero-id",
        header="Serialization handles id=0",
        description="Checks that id=0 serializes and round-trips correctly.",
        test_input="serialize insert into users (id, name, email) values (0, 'test', 'test@test.com');\n.exit\n",
        expected="Field id = 0 and Round-trip: OK",
        must_contain=["[SERIALIZE] Field id = 0", "[SERIALIZE] Round-trip: OK"],
    ),
    TestCase(
        name="serialize-large-id",
        header="Serialization handles large id",
        description="Checks that a large integer id (65535) serializes and round-trips correctly.",
        test_input="serialize insert into users (id, name, email) values (65535, 'test', 'test@test.com');\n.exit\n",
        expected="Field id = 65535 and Round-trip: OK",
        must_contain=["[SERIALIZE] Field id = 65535", "[SERIALIZE] Round-trip: OK"],
    ),
    TestCase(
        name="serialize-empty-strings",
        header="Serialization handles empty strings",
        description="Checks that empty name and email fields serialize and round-trip correctly.",
        test_input="serialize insert into users (id, name, email) values (1, '', '');\n.exit\n",
        expected="Round-trip: OK with empty string fields",
        must_contain=["[SERIALIZE] Round-trip: OK", "[SERIALIZE] Row Size: 508"],
    ),
    TestCase(
        name="serialize-layout-offsets",
        header="Serialization shows layout with byte offsets",
        description="Checks that the layout line displays field byte offsets.",
        test_input="serialize insert into users (id, name, email) values (1, 'a', 'b');\n.exit\n",
        expected="Layout line with byte offsets",
        must_contain=["[SERIALIZE] Layout:"],
    ),
    TestCase(
        name="serialize-syntax-error",
        header="Serialize with invalid SQL returns error",
        description="Checks that malformed SQL in the serialize command produces an error code.",
        test_input="serialize insert into;\n.exit\n",
        expected="Error code in output",
        must_contain=["[ERROR:"],
    ),
    TestCase(
        name="serialize-cli-mode",
        header="Serialize works in -c CLI mode",
        description="Checks that the serialize command works when invoked via the -c flag.",
        test_input="",
        expected="[SERIALIZE] output via CLI -c mode",
        must_contain=["[SERIALIZE]", "Round-trip: OK"],
        cli_args=["-c", "serialize insert into users (id, name, email) values (1, 'test', 'test@test.com');"],
    ),
]


def run_case(binary: str, case: TestCase) -> CommandResult:
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
    return results
