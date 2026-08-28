module Api
  module V1
    class SubmissionsController < ::ApplicationController
      before_action :authenticate_user!

      def index
        submissions = current_user.submissions.order(created_at: :desc)

        render json: submissions.map { |s|
          test_run = s.test_run
          {
            id: s.id,
            stage_slug: s.stage_slug,
            language_slug: s.language_slug,
            status: s.status,
            created_at: s.created_at,
            test_run: test_run ? {
              total_passed: test_run.total_passed,
              total_failed: test_run.total_failed
            } : nil
          }
        }
      end

      def create
        submission = current_user.submissions.new(submission_params)

        if submission.save
          current_user.workspaces.find_or_initialize_by(
            stage_slug: submission.stage_slug,
            language_slug: submission.language_slug
          ).update(code_files: submission.code_files)

          render json: {
            id: submission.id,
            status: submission.status,
            stage_slug: submission.stage_slug,
            language_slug: submission.language_slug,
            created_at: submission.created_at
          }, status: :accepted
        else
          render json: { errors: submission.errors.full_messages }, status: :unprocessable_content
        end
      end

      def show
        submission = current_user.submissions.find(params[:id])
        test_run = submission.test_run

        render json: {
          id: submission.id,
          status: submission.status,
          stage_slug: submission.stage_slug,
          language_slug: submission.language_slug,
          created_at: submission.created_at,
          test_run: test_run ? {
            id: test_run.id,
            status: test_run.status,
            compile_logs: test_run.compile_logs,
            duration_ms: test_run.duration_ms,
            total_passed: test_run.total_passed,
            total_failed: test_run.total_failed,
            test_cases: test_run.test_case_results.map do |tc|
              {
                name: tc.case_name,
                passed: tc.passed,
                input: tc.input_given,
                expected: tc.expected_output,
                actual: tc.actual_output,
                exit_code: tc.exit_code,
                reason: tc.failure_reason
              }
            end
          } : nil
        }
      end

      private

      def submission_params
        params.require(:submission).permit(:stage_slug, :language_slug, code_files: {})
      end
    end
  end
end
