#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys

from stage1.repl_tests import run_suite as run_stage1_suite
from stage2.parser_tests import run_suite as run_stage2_suite
from stage3.planner_executor_tests import run_suite as run_stage3_suite
from utils import format_result


STAGE_RUNNERS = {
    "stage1": run_stage1_suite,
    "stage2": run_stage2_suite,
    "stage3": run_stage3_suite,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run integration tests across selected tutorial stages."
    )
    parser.add_argument(
        "--bins",
        nargs="+",
        required=True,
        help="List of binaries to test (e.g. bin/c-db bin/cpp-db)",
    )
    parser.add_argument(
        "--stage",
        choices=["stage1", "stage2", "stage3", "all"],
        default="stage1",
        help="Choose which stage to run (default: stage1)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    missing = [b for b in args.bins if not os.path.isfile(b) or not os.access(b, os.X_OK)]
    if missing:
        print("Missing or non-executable binaries:")
        for item in missing:
            print(f"- {item}")
        return 2

    selected_stages = [args.stage] if args.stage != "all" else ["stage1", "stage2", "stage3"]

    results = []
    for stage in selected_stages:
        stage_results = STAGE_RUNNERS[stage](args.bins)
        if not stage_results:
            print(f"[INFO] {stage}: no tests implemented yet.")
        results.extend(stage_results)

    if not results:
        print("No tests executed.")
        return 0

    failed = 0
    for result in results:
        print("=" * 80)
        print(format_result(result))
        if not result.passed:
            failed += 1

    print("=" * 80)
    total = len(results)
    passed = total - failed
    print(f"summary: passed={passed} failed={failed} total={total}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
