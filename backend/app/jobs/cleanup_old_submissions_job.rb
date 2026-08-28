class CleanupOldSubmissionsJob < ApplicationJob
  queue_as :default

  def perform
    Submission.where.not(status: :passed)
              .where("created_at < ?", 1.week.ago)
              .destroy_all
  end
end
