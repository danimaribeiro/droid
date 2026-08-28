class Submission < ApplicationRecord
  belongs_to :user
  has_one :test_run, dependent: :destroy

  enum :status, {
    pending: 0,
    compiling: 1,
    running: 2,
    passed: 3,
    failed: 4,
    errored: 5
  }, default: :pending

  validates :stage_slug, presence: true
  validates :language_slug, presence: true
  validates :code_files, presence: true

  SUPPORTED_LANGUAGES = %w[c cpp rust zig python ruby].freeze

  validates :language_slug, inclusion: { in: SUPPORTED_LANGUAGES }

  after_create_commit :enqueue_execution

  private

  def enqueue_execution
    TestExecutionJob.perform_later(id)
  end
end
