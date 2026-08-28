class TestRun < ApplicationRecord
  belongs_to :submission
  has_many :test_case_results, dependent: :destroy

  enum :status, {
    completed: 0,
    build_failed: 1,
    system_error: 2,
    timeout: 3,
    no_test_output: 4
  }, default: :completed
end
