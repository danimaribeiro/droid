require "rails_helper"

RSpec.describe CleanupOldSubmissionsJob, type: :job do
  let(:user) { User.first || User.create!(name: "Test", email: "cleanup-test@droid.dev", password: "password") }

  it "deletes non-passed submissions older than one week" do
    old_failed = user.submissions.create!(
      stage_slug: "database/repl", language_slug: "c", status: :failed,
      code_files: { "main.c" => "int main(){}" }, created_at: 2.weeks.ago
    )
    old_errored = user.submissions.create!(
      stage_slug: "database/repl", language_slug: "c", status: :errored,
      code_files: { "main.c" => "int main(){}" }, created_at: 10.days.ago
    )

    described_class.perform_now

    expect(Submission.exists?(old_failed.id)).to be false
    expect(Submission.exists?(old_errored.id)).to be false
  end

  it "preserves passed submissions regardless of age" do
    old_passed = user.submissions.create!(
      stage_slug: "database/repl", language_slug: "c", status: :passed,
      code_files: { "main.c" => "int main(){}" }, created_at: 2.weeks.ago
    )

    described_class.perform_now

    expect(Submission.exists?(old_passed.id)).to be true
  end

  it "preserves recent non-passed submissions" do
    recent_failed = user.submissions.create!(
      stage_slug: "database/repl", language_slug: "c", status: :failed,
      code_files: { "main.c" => "int main(){}" }, created_at: 3.days.ago
    )

    described_class.perform_now

    expect(Submission.exists?(recent_failed.id)).to be true
  end
end
