class Workspace < ApplicationRecord
  belongs_to :user

  validates :stage_slug, presence: true
  validates :language_slug, presence: true, inclusion: { in: Submission::SUPPORTED_LANGUAGES }
end
