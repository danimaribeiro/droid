#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from collections import defaultdict

from part1.stage1.repl_tests import run_suite as run_stage1_suite
from part1.stage2.lexer_tests import run_suite as run_stage2_suite
from part1.stage3.parser_tests import run_suite as run_stage3_suite
from part1.stage4.serialization_tests import run_suite as run_stage4_suite
from part1.stage5.pager_tests import run_suite as run_stage5_suite
from part1.stage6.btree_leaf_tests import run_suite as run_stage6_suite
from part1.stage7.btree_search_tests import run_suite as run_stage7_suite
from part1.stage8.btree_split_tests import run_suite as run_stage8_suite
from part1.stage9.btree_internal_split_tests import run_suite as run_stage9_suite
from part1.stage10.persistence_tests import run_suite as run_stage10_suite
from part1.stage11.planner_tests import run_suite as run_stage11_suite
from part1.stage12.delete_update_tests import run_suite as run_stage12_delete_update_suite
from part2.stage1.wal_tests import run_suite as run_part2_stage1_suite
from part2.stage2.transaction_commit_tests import run_suite as run_part2_stage2_suite
from part2.stage3.transaction_rollback_tests import run_suite as run_part2_stage3_suite
from part2.stage4.create_table_tests import run_suite as run_part2_stage4_suite
from part2.stage5.schema_validation_tests import run_suite as run_part2_stage5_suite
from part2.stage6.varlen_serialization_tests import run_suite as run_part2_stage6_suite
from part2.stage7.slotted_page_tests import run_suite as run_part2_stage7_suite
from part2.stage8.varlen_btree_tests import run_suite as run_part2_stage8_suite
from utils import format_result


STAGE_RUNNERS = {
    # Canonical category slugs (<part>/<stage>)
    "database/repl": run_stage1_suite,
    "database/lexer": run_stage2_suite,
    "database/parser": run_stage3_suite,
    "database/row-serialization": run_stage4_suite,
    "database/pager": run_stage5_suite,
    "database/btree-leaf": run_stage6_suite,
    "database/btree-search": run_stage7_suite,
    "database/btree-split": run_stage8_suite,
    "database/persistence": run_stage9_suite,
    "database/planner": run_stage10_suite,
    "database/index-scan": run_stage11_suite,
    "database/delete-update": run_stage12_delete_update_suite,
    "advanced-storage/wal": run_part2_stage1_suite,
    "advanced-storage/commit": run_part2_stage2_suite,
    "advanced-storage/rollback": run_part2_stage3_suite,
    "advanced-storage/create-table": run_part2_stage4_suite,
    "advanced-storage/schema-validation": run_part2_stage5_suite,
    "advanced-storage/varlen-serialization": run_part2_stage6_suite,
    "advanced-storage/slotted-page": run_part2_stage7_suite,
    "advanced-storage/varlen-btree": run_part2_stage8_suite,

    # Legacy stage aliases for backward compatibility
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
    "stage12": run_stage12_delete_update_suite,
    "stage12-delete-update": run_stage12_delete_update_suite,
    "part2-stage1": run_part2_stage1_suite,
    "part2-stage2": run_part2_stage2_suite,
    "part2-stage3": run_part2_stage3_suite,
    "part2-stage4": run_part2_stage4_suite,
    "part2-stage5": run_part2_stage5_suite,
    "part2-stage6": run_part2_stage6_suite,
    "part2-stage7": run_part2_stage7_suite,
    "part2-stage8": run_part2_stage8_suite,
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
        choices=list(STAGE_RUNNERS.keys()) + ["all"],
        default="database/repl",
        help="Choose which stage to run (default: database/repl)",
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
