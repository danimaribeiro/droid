require "faraday"
require "json"

class PistonExecutionService
  PISTON_URL = ENV.fetch("PISTON_URL", "http://piston:2000")

  BUILD_COMMANDS = {
    "c" => {
      lang: "bash",
      build: "mkdir -p bin && gcc -Wall -Wextra -std=c99 -o bin/c-db c-droid/*.c",
      binary: "./bin/c-db"
    },
    "cpp" => {
      lang: "bash",
      build: "mkdir -p bin && g++ -Wall -std=c++17 -o bin/cpp-db cpp-droid/*.cpp",
      binary: "./bin/cpp-db"
    },
    "rust" => {
      lang: "bash",
      build: "cd rust-droid && cargo build --release",
      binary: "./rust-droid/target/release/rust-db"
    },
    "zig" => {
      lang: "bash",
      build: "mkdir -p bin && cd zig-droid && zig build-exe main.zig -femit-bin=../bin/zig-db",
      binary: "./bin/zig-db"
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

  def build_payload
    files = []

    # First file in Piston payload acts as entrypoint script
    runner_script = <<~SHELL
      #!/bin/bash
      set -e
      # 1. Compile target binary
      #{@config[:build]}

      # 2. Run pre-baked stage integration test suite
      if [ -f "/droid/tests/integration/run_tests.py" ]; then
        python3 /droid/tests/integration/run_tests.py --bins #{@config[:binary]} --stage #{@submission.stage_slug} --json
      elif [ -f "tests/integration/run_tests.py" ]; then
        python3 tests/integration/run_tests.py --bins #{@config[:binary]} --stage #{@submission.stage_slug} --json
      else
        echo "[INFO] Running compiled binary..."
        #{@config[:binary]}
      fi
    SHELL

    files << { name: "run.sh", content: runner_script }

    # Append student code files preserving folder paths (e.g. c-droid/main.c)
    @submission.code_files.each do |filename, content|
      files << { name: filename, content: content }
    end

    {
      language: "bash",
      version: "*",
      files: files,
      run_timeout: 15_000,
      compile_timeout: 30_000
    }
  end

  def process_response(body)
    return { status: :system_error, compile_logs: "Empty response from execution engine", passed: false } if body.nil?

    compile_output = body.dig("compile", "output") || ""
    run_stdout = body.dig("run", "output") || ""
    run_stderr = body.dig("run", "stderr") || ""
    exit_code = body.dig("run", "code") || 0

    if body["compile"] && body.dig("compile", "code") != 0
      return {
        status: :build_failed,
        compile_logs: compile_output,
        passed: false
      }
    end

    parsed_test_cases = parse_json_test_output(run_stdout)

    {
      status: exit_code.zero? ? :completed : :completed,
      compile_logs: compile_output,
      stdout: run_stdout,
      stderr: run_stderr,
      exit_code: exit_code,
      passed: exit_code.zero? && (parsed_test_cases[:failed_count] == 0),
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
    { cases: [], failed_count: 0 }
  end
end
