#!/usr/bin/env python3
"""Run a single test case by name."""

import sys
from stage1.repl_tests import CASES, run_case
from utils import format_result


def main():
    if len(sys.argv) != 3:
        print("Usage: test_single_case.py <case-name> <binary>")
        print("\nAvailable cases:")
        for case in CASES:
            print(f"  - {case.name}")
        sys.exit(1)

    case_name = sys.argv[1]
    binary = sys.argv[2]

    for case in CASES:
        if case.name == case_name:
            result = run_case(binary, case)
            print(f"\n{'='*80}")
            print(format_result(result))
            print(f"{'='*80}\n")
            print(f"Result: {'PASS' if result.passed else 'FAIL'}")
            sys.exit(0 if result.passed else 1)

    print(f"Case '{case_name}' not found")
    sys.exit(1)


if __name__ == "__main__":
    main()
