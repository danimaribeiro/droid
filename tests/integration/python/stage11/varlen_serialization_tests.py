from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, run_command


STAGE_ID = "stage11"
STAGE_TITLE = "Variable-Length Row Serialization"


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
        name="varlen-serialize-short",
        header="Short strings produce a compact row",
        description="Variable-length row with short fields should be much smaller than 508 bytes.",
        test_input="serialize insert into users (id, name, email) values (1, 'dan', 'd@e');\n.exit\n",
        expected="Row Size < 508 with (variable) tag and Round-trip: OK",
        must_contain=["[SERIALIZE]", "(variable)", "Round-trip: OK"],
        must_not_contain=["Row Size: 508"],
    ),
    TestCase(
        name="varlen-serialize-exact-size",
        header="Row size matches expected byte count",
        description="name='dan'(3) + email='d@e'(3) → row_size=4+4+2+3+2+3=18 bytes.",
        test_input="serialize insert into users (id, name, email) values (1, 'dan', 'd@e');\n.exit\n",
        expected="Row Size: 18 bytes",
        must_contain=["Row Size: 18"],
    ),
    TestCase(
        name="varlen-serialize-empty",
        header="Empty strings produce minimal row",
        description="Empty name and email → row_size=4+4+2+0+2+0=12 bytes (just headers).",
        test_input="serialize insert into users (id, name, email) values (1, '', '');\n.exit\n",
        expected="Row Size: 12 bytes",
        must_contain=["Row Size: 12", "Round-trip: OK"],
    ),
    TestCase(
        name="varlen-serialize-long",
        header="Long strings produce larger row",
        description="A 100-char name should produce a row > 100 bytes.",
        test_input=(
            "serialize insert into users (id, name, email) values (1, "
            "'" + "a" * 100 + "', 'test@test.com');\n"
            ".exit\n"
        ),
        expected="Row size > 100 and Round-trip: OK",
        must_contain=["(100 bytes)", "Round-trip: OK"],
    ),
    TestCase(
        name="varlen-serialize-layout",
        header="Layout shows variable-length offsets",
        description="Layout line should show field byte offsets with actual sizes.",
        test_input="serialize insert into users (id, name, email) values (1, 'dan', 'd@e');\n.exit\n",
        expected="Layout line with variable field sizes",
        must_contain=["[SERIALIZE] Layout:", "name:3@", "email:3@"],
    ),
    TestCase(
        name="varlen-serialize-round-trip",
        header="Round-trip works for various sizes",
        description="Serialize then deserialize a row with medium-length fields.",
        test_input="serialize insert into users (id, name, email) values (42, 'danimar', 'danimar@email.com');\n.exit\n",
        expected="Round-trip: OK with correct field values",
        must_contain=["Round-trip: OK", "Field id = 42", "danimar", "danimar@email.com"],
    ),
    TestCase(
        name="varlen-serialize-error",
        header="Serialize with bad SQL returns error",
        description="Malformed SQL should produce an error code.",
        test_input="serialize insert into;\n.exit\n",
        expected="Error code in output",
        must_contain=["[ERROR:"],
    ),
]


def run_case(binary: str, case: TestCase) -> CommandResult:
    exit_code, stdout, stderr, timed_out = run_command(
        binary=binary, test_input=case.test_input, cli_args=case.cli_args or None,
    )
    actual_text = f"{stdout}{stderr}"

    if timed_out:
        return CommandResult(
            stage=STAGE_ID, stage_title=STAGE_TITLE, binary=binary,
            cli_args=case.cli_args or [], case_name=case.name,
            case_header=case.header, case_description=case.description,
            test_input=case.test_input, expected=case.expected,
            stdout=stdout, stderr=stderr, exit_code=exit_code,
            timed_out=True, passed=False,
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
        cli_args=case.cli_args or [], case_name=case.name,
        case_header=case.header, case_description=case.description,
        test_input=case.test_input, expected=case.expected,
        stdout=stdout, stderr=stderr, exit_code=exit_code,
        timed_out=False, passed=passed, reason="; ".join(reasons),
    )


def run_suite(binaries: Iterable[str]) -> list[CommandResult]:
    results: list[CommandResult] = []
    for binary in binaries:
        for case in CASES:
            print(f"[RUN] binary={binary} case={case.name}", flush=True)
            results.append(run_case(binary, case))
    return results
