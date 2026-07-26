#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from collections import defaultdict

from stage1.repl_tests import run_suite as run_stage1_suite
from stage2.lexer_tests import run_suite as run_stage2_suite
from stage3.parser_tests import run_suite as run_stage3_suite
from stage4.serialization_tests import run_suite as run_stage4_suite
from stage5.pager_tests import run_suite as run_stage5_suite
from stage6.btree_leaf_tests import run_suite as run_stage6_suite
from stage7.btree_search_tests import run_suite as run_stage7_suite
from stage8.btree_split_tests import run_suite as run_stage8_suite
from stage9.persistence_tests import run_suite as run_stage9_suite
from stage10.planner_tests import run_suite as run_stage10_suite
from stage11.varlen_serialization_tests import run_suite as run_stage11_suite
from stage12.slotted_page_tests import run_suite as run_stage12_suite
from stage13.varlen_btree_tests import run_suite as run_stage13_suite
from stage14.create_table_tests import run_suite as run_stage14_suite
from stage15.schema_validation_tests import run_suite as run_stage15_suite
from stage16.transaction_commit_tests import run_suite as run_stage16_suite
from stage17.transaction_rollback_tests import run_suite as run_stage17_suite
from stage18.wal_tests import run_suite as run_stage18_suite
from utils import format_result


STAGE_RUNNERS = {
    "stage1": run_stage1_suite,
    "stage2": run_stage2_suite,
    "stage3": run_stage3_suite,
    "stage4": run_stage4_suite,
    "stage5": run_stage5_suite,
    "stage6": run_stage6_suite,
    "stage7": run_stage7_suite,
    "stage8": run_stage8_suite,
    "stage9": run_stage9_suite,
    "stage10": run_stage10_suite,
    "stage11": run_stage11_suite,
    "stage12": run_stage12_suite,
    "stage13": run_stage13_suite,
    "stage14": run_stage14_suite,
    "stage15": run_stage15_suite,
    "stage16": run_stage16_suite,
    "stage17": run_stage17_suite,
    "stage18": run_stage18_suite,
}

GREEN = "\033[32m"
RED = "\033[31m"
RESET = "\033[0m"


def colorize(text: str, color: str) -> str:
    if os.getenv("NO_COLOR") is not None:
        return text
    if not sys.stdout.isatty():
        return text
    return f"{color}{text}{RESET}"


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
        choices=["stage1", "stage2", "stage3", "stage4", "stage5",
                 "stage6", "stage7", "stage8", "stage9", "stage10",
                 "stage11", "stage12", "stage13", "stage14", "stage15",
                 "stage16", "stage17", "stage18", "all"],
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

    all_stages = list(STAGE_RUNNERS.keys())
    selected_stages = [args.stage] if args.stage != "all" else all_stages

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
    case_outcomes: dict[str, list[bool]] = defaultdict(list)
    for result in results:
        if result.passed:
            print(
                colorize(
                    f"binary: {result.binary} case: {result.case_name} status: PASS",
                    GREEN,
                )
            )
        else:
            print(colorize("=" * 80, RED))
            print(format_result(result))
        case_outcomes[result.case_name].append(result.passed)
        if not result.passed:
            failed += 1

    print("=" * 80)
    execution_total = len(results)
    execution_passed = execution_total - failed
    print(
        f"summary-executions: passed={execution_passed} failed={failed} total={execution_total}"
    )

    scenario_total = len(case_outcomes)
    scenario_passed = sum(1 for outcomes in case_outcomes.values() if all(outcomes))
    scenario_failed = scenario_total - scenario_passed
    print(
        f"summary-scenarios: passed={scenario_passed} failed={scenario_failed} total={scenario_total}"
    )

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
