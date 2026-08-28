require "faraday"
require "json"

class PistonExecutionService
  PISTON_URL = ENV.fetch("PISTON_URL", "http://piston:2000")
  TESTS_DIR = Rails.root.join("tests/integration").to_s

  STAGE_TEST_FILES = {
    "database/repl" => "part1/stage1/repl_tests.py",
    "database/lexer" => "part1/stage2/lexer_tests.py",
    "database/parser" => "part1/stage3/parser_tests.py",
    "database/row-serialization" => "part1/stage4/serialization_tests.py",
    "database/pager" => "part1/stage5/pager_tests.py",
    "database/btree-leaf" => "part1/stage6/btree_leaf_tests.py",
    "database/btree-search" => "part1/stage7/btree_search_tests.py",
    "database/btree-split" => "part1/stage8/btree_split_tests.py",
    "database/persistence" => "part1/stage9/btree_internal_split_tests.py",
    "database/planner" => "part1/stage10/persistence_tests.py",
    "database/index-scan" => "part1/stage11/planner_tests.py",
    "database/delete-update" => "part1/stage12/delete_update_tests.py",
    "advanced-storage/wal" => "part2/stage1/wal_tests.py",
    "advanced-storage/commit" => "part2/stage2/transaction_commit_tests.py",
    "advanced-storage/rollback" => "part2/stage3/transaction_rollback_tests.py",
    "advanced-storage/create-table" => "part2/stage4/create_table_tests.py",
    "advanced-storage/schema-validation" => "part2/stage5/schema_validation_tests.py",
    "advanced-storage/varlen-serialization" => "part2/stage6/varlen_serialization_tests.py",
    "advanced-storage/slotted-page" => "part2/stage7/slotted_page_tests.py",
    "advanced-storage/varlen-btree" => "part2/stage8/varlen_btree_tests.py"
  }.freeze

  BUILD_COMMANDS = {
    "c" => {
      build: "mkdir -p bin && gcc -Wall -Wextra -std=c99 -o bin/c-db c-droid/*.c",
      binary: "./bin/c-db"
    },
    "cpp" => {
      build: "mkdir -p bin && g++ -Wall -std=c++17 -o bin/cpp-db cpp-droid/*.cpp",
      binary: "./bin/cpp-db"
    },
    "rust" => {
      build: "cargo build --release --manifest-path rust-droid/Cargo.toml",
      binary: "./rust-droid/target/release/rust-db"
    },
    "zig" => {
      build: "mkdir -p bin && zig build-exe zig-droid/main.zig -femit-bin=bin/zig-db",
      binary: "./bin/zig-db"
    },
    "python" => {
      build: "mkdir -p bin && printf '#!/bin/bash\\npython3 python-droid/main.py \"$@\"\\n' > bin/python-db && chmod +x bin/python-db",
      binary: "./bin/python-db"
    },
    "ruby" => {
      build: "mkdir -p bin && printf '#!/bin/bash\\nruby ruby-droid/main.rb \"$@\"\\n' > bin/ruby-db && chmod +x bin/ruby-db",
      binary: "./bin/ruby-db"
    }
  }.freeze

  def self.execute(submission)
    new(submission).execute
  end

  def initialize(submission)
    @submission = submission
    @config = BUILD_COMMANDS.fetch(submission.language_slug)
  end

  def execute
    payload = build_payload
    connection = Faraday.new(url: PISTON_URL) do |faraday|
      faraday.request :json
      faraday.response :json
      faraday.adapter Faraday.default_adapter
    end

    response = connection.post("/api/v2/execute", payload)
    process_response(response.body)
  rescue StandardError => e
    {
      status: :system_error,
      compile_logs: "Internal execution service error: #{e.message}",
      passed: false
    }
  end

  private

  EXTRA_TOOL_PATHS = %w[
    /piston/packages/rust/1.68.2/rust-1.68.2-x86_64-unknown-linux-gnu/cargo/bin
    /piston/packages/rust/1.68.2/rust-1.68.2-x86_64-unknown-linux-gnu/rustc/bin
    /piston/packages/zig/0.10.1/bin
    /piston/packages/ruby/3.0.1/bin
  ].freeze

  def build_payload
    files = []

    build_step = @config[:build] ? "#{@config[:build]}\n" : ""
    runner_script = <<~SHELL
      #!/bin/bash
      set -e
      export PATH=#{EXTRA_TOOL_PATHS.join(":")}:$PATH
      export RUST_INSTALL_LOC=/piston/packages/rust/1.68.2/rust-1.68.2-x86_64-unknown-linux-gnu
      #{build_step}python3 run_stage.py --bin #{@config[:binary]} --json
    SHELL

    files << { name: "run.sh", content: runner_script }

    @submission.code_files.each do |filename, content|
      files << { name: filename, content: content }
    end

    files << { name: "utils.py", content: File.read("#{TESTS_DIR}/utils.py") }

    test_file = STAGE_TEST_FILES[@submission.stage_slug]
    files << { name: "stage_tests.py", content: File.read("#{TESTS_DIR}/#{test_file}") }

    files << { name: "run_stage.py", content: stage_runner_script }

    {
      language: "bash",
      version: "*",
      files: files,
      run_timeout: 25_000,
      compile_timeout: 10_000,
      run_cpu_time: 25_000
    }
  end

  def stage_runner_script
    <<~PYTHON
      import argparse, json, sys
      from stage_tests import run_suite

      parser = argparse.ArgumentParser()
      parser.add_argument("--bin", required=True)
      parser.add_argument("--json", action="store_true", dest="json_output")
      args = parser.parse_args()

      results = run_suite([args.bin])

      if args.json_output:
          json_results = []
          for r in results:
              json_results.append({
                  "name": r.case_name,
                  "passed": r.passed,
                  "input": r.test_input,
                  "expected": r.expected,
                  "actual": r.actual_output,
                  "exit_code": r.exit_code,
                  "reason": r.reason,
              })
          passed_count = sum(1 for r in json_results if r["passed"])
          failed_count = len(json_results) - passed_count
          print(json.dumps({
              "results": json_results,
              "summary": {"passed": passed_count, "failed": failed_count, "total": len(json_results)},
          }))
          sys.exit(1 if failed_count else 0)
      else:
          for r in results:
              status = "PASS" if r.passed else "FAIL"
              print(f"{r.case_name}: {status}")
          sys.exit(1 if any(not r.passed for r in results) else 0)
    PYTHON
  end

  def process_response(body)
    return { status: :system_error, compile_logs: "Empty response from execution engine", passed: false } if body.nil?

    if body["message"]
      return {
        status: :system_error,
        compile_logs: body["message"],
        passed: false
      }
    end

    run_stdout = body.dig("run", "stdout") || ""
    run_stderr = body.dig("run", "stderr") || ""
    run_output = body.dig("run", "output") || ""
    exit_code = body.dig("run", "code") || 0

    parsed_test_cases = parse_json_test_output(run_stdout)

    if parsed_test_cases[:cases].empty? && exit_code != 0 && run_stderr.match?(/error:|undefined reference|ld returned/i)
      return {
        status: :build_failed,
        compile_logs: run_output,
        passed: false
      }
    end

    has_test_results = parsed_test_cases[:cases].any?
    passed = has_test_results && exit_code.zero? && parsed_test_cases[:failed_count] == 0

    {
      status: has_test_results ? :completed : :no_test_output,
      compile_logs: run_stderr.presence || run_output,
      stdout: run_stdout,
      stderr: run_stderr,
      exit_code: exit_code,
      passed: passed,
      test_cases: parsed_test_cases[:cases]
    }
  end

  def parse_json_test_output(stdout)
    json_start = stdout.index("{")
    return { cases: [], failed_count: 0 } unless json_start

    data = JSON.parse(stdout[json_start..])
    cases = data["results"] || []
    failed_count = cases.count { |c| !c["passed"] }

    { cases: cases, failed_count: failed_count }
  rescue JSON::ParserError
    { cases: [], failed_count: 1 }
  end
end
