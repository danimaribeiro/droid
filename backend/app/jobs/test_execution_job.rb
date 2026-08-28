class TestExecutionJob < ApplicationJob
  queue_as :default

  def perform(submission_id)
    submission = Submission.find(submission_id)
    submission.compiling!

    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    submission.running!
    result = PistonExecutionService.execute(submission)
    end_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    duration_ms = ((end_time - start_time) * 1000).to_i

    test_cases = result[:test_cases] || []
    passed_cases = test_cases.count { |tc| tc["passed"] }
    failed_cases = test_cases.count { |tc| !tc["passed"] }

    test_run = submission.create_test_run!(
      status: result[:status] || :completed,
      compile_logs: result[:compile_logs] || "",
      duration_ms: duration_ms,
      total_passed: test_cases.any? ? passed_cases : (result[:passed] ? 1 : 0),
      total_failed: test_cases.any? ? failed_cases : (result[:passed] ? 0 : 1),
      executed_at: Time.current
    )

    # Persist individual test case assertions
    test_cases.each do |tc|
      test_run.test_case_results.create!(
        case_name: tc["name"] || "test_case",
        passed: tc["passed"] || false,
        input_given: tc["input"] || "",
        expected_output: tc["expected"] || "",
        actual_output: tc["actual"] || "",
        exit_code: tc["exit_code"],
        failure_reason: tc["reason"] || ""
      )
    end

    if result[:status] == :no_test_output
      submission.errored!
    elsif result[:status] == :build_failed
      submission.failed!
    elsif result[:passed]
      submission.passed!
    else
      submission.failed!
    end

    # Broadcast updates via ActionCable / Solid Cable
    ActionCable.server.broadcast("submission_#{submission.id}", {
      status: submission.status,
      test_run_id: test_run.id
    })
  end
end
