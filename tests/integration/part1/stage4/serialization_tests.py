from __future__ import annotations

import struct
from dataclasses import dataclass, field
from typing import Iterable

from utils import CommandResult, run_command


STAGE_ID = "stage4"
STAGE_TITLE = "Row Serialization"

ROW_ID_SIZE = 4
ROW_NAME_SIZE = 28
ROW_EMAIL_SIZE = 28
ROW_SIZE = ROW_ID_SIZE + ROW_NAME_SIZE + ROW_EMAIL_SIZE  # 60


def build_expected_hex(id_val: int, name: str, email: str) -> str:
    """Build the expected hex string for a serialized row."""
    buf = bytearray(ROW_SIZE)
    # id: little-endian int32 at offset 0
    struct.pack_into("<i", buf, 0, id_val)
    # name: at offset 4, zero-padded
    name_bytes = name.encode("utf-8")[:ROW_NAME_SIZE]
    buf[ROW_ID_SIZE : ROW_ID_SIZE + len(name_bytes)] = name_bytes
    # email: at offset 32, zero-padded
    email_bytes = email.encode("utf-8")[:ROW_EMAIL_SIZE]
    buf[ROW_ID_SIZE + ROW_NAME_SIZE : ROW_ID_SIZE + ROW_NAME_SIZE + len(email_bytes)] = email_bytes
    return " ".join(f"{b:02x}" for b in buf)


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


# Pre-compute expected hex strings
HEX_DAN = build_expected_hex(1, "dan", "dan@test.com")
HEX_DANIMAR = build_expected_hex(1, "danimar", "danimar@email.com")
HEX_ZERO_ID = build_expected_hex(0, "test", "test@test.com")
HEX_LARGE_ID = build_expected_hex(65535, "test", "test@test.com")
HEX_EMPTY = build_expected_hex(1, "", "")

CASES: list[TestCase] = [
    # ── Serialize tests ──
    TestCase(
        name="serialize-valid-insert",
        header="Serialize produces correct hex dump",
        description="Checks that 'serialize insert into users ...' outputs the exact hex bytes for the serialized row.",
        test_input="serialize insert into users (id, name, email) values (1, 'danimar', 'danimar@email.com');\n.exit\n",
        expected=f"[SERIALIZE] {HEX_DANIMAR}",
        must_contain=[f"[SERIALIZE] {HEX_DANIMAR}"],
    ),
    TestCase(
        name="serialize-zero-id",
        header="Serialize handles id=0",
        description="Checks that id=0 serializes correctly (first 4 bytes are 00 00 00 00).",
        test_input="serialize insert into users (id, name, email) values (0, 'test', 'test@test.com');\n.exit\n",
        expected=f"[SERIALIZE] {HEX_ZERO_ID}",
        must_contain=["[SERIALIZE] 00 00 00 00"],
    ),
    TestCase(
        name="serialize-large-id",
        header="Serialize handles large id (65535)",
        description="Checks that a large integer id serializes correctly in little-endian.",
        test_input="serialize insert into users (id, name, email) values (65535, 'test', 'test@test.com');\n.exit\n",
        expected=f"[SERIALIZE] {HEX_LARGE_ID}",
        must_contain=["[SERIALIZE] ff ff 00 00"],
    ),
    TestCase(
        name="serialize-empty-strings",
        header="Serialize handles empty strings",
        description="Checks that empty name and email produce zero-padded fields.",
        test_input="serialize insert into users (id, name, email) values (1, '', '');\n.exit\n",
        expected=f"[SERIALIZE] {HEX_EMPTY}",
        must_contain=[f"[SERIALIZE] {HEX_EMPTY}"],
    ),
    TestCase(
        name="serialize-full-hex-match",
        header="Serialize full hex matches expected bytes",
        description="Validates the complete 60-byte hex output byte-by-byte.",
        test_input="serialize insert into users (id, name, email) values (1, 'dan', 'dan@test.com');\n.exit\n",
        expected=f"[SERIALIZE] {HEX_DAN}",
        must_contain=[f"[SERIALIZE] {HEX_DAN}"],
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
        expected="[SERIALIZE] hex output via CLI -c mode",
        must_contain=["[SERIALIZE]"],
        cli_args=["-c", "serialize insert into users (id, name, email) values (1, 'test', 'test@test.com');"],
    ),
    # ── Deserialize tests ──
    TestCase(
        name="deserialize-valid",
        header="Deserialize produces correct field values",
        description="Sends a known hex buffer and checks that all fields are correctly deserialized.",
        test_input=f"deserialize {HEX_DANIMAR}\n.exit\n",
        expected="[DESERIALIZE] fields for id=1, name=danimar, email=danimar@email.com",
        must_contain=[
            "[DESERIALIZE] Field id = 1",
            "[DESERIALIZE] Field name = danimar",
            "[DESERIALIZE] Field email = danimar@email.com",
        ],
    ),
    TestCase(
        name="deserialize-zero-id",
        header="Deserialize handles id=0",
        description="Sends a hex buffer with id=0 and checks deserialization.",
        test_input=f"deserialize {HEX_ZERO_ID}\n.exit\n",
        expected="[DESERIALIZE] Field id = 0",
        must_contain=["[DESERIALIZE] Field id = 0"],
    ),
    TestCase(
        name="deserialize-round-trip",
        header="Serialize then deserialize produces matching fields",
        description="Serializes a row and feeds the hex output into deserialize to verify round-trip.",
        test_input=f"serialize insert into users (id, name, email) values (1, 'dan', 'dan@test.com');\ndeserialize {HEX_DAN}\n.exit\n",
        expected="Both [SERIALIZE] and [DESERIALIZE] output present with matching data",
        must_contain=[
            "[SERIALIZE]",
            "[DESERIALIZE] Field id = 1",
            "[DESERIALIZE] Field name = dan",
            "[DESERIALIZE] Field email = dan@test.com",
        ],
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
