class User < ApplicationRecord
  has_secure_password
  has_many :submissions, dependent: :destroy

  validates :email, presence: true, uniqueness: true
  validates :name, presence: true

  before_create :generate_authentication_token

  private

  def generate_authentication_token
    self.authentication_token = SecureRandom.hex(32)
  end
end
