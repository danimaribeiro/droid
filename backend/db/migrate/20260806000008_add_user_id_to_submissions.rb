class AddUserIdToSubmissions < ActiveRecord::Migration[8.0]
  def change
    add_reference :submissions, :user, type: :uuid, null: false, foreign_key: true
  end
end
