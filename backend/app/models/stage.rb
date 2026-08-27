class Stage < ApplicationRecord
  validates :slug, presence: true, uniqueness: true
  validates :title, presence: true
  validates :stage_number, presence: true
end
