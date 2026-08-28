class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users, id: :uuid do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name
      t.boolean :admin, default: false, null: false
      t.string :authentication_token
      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :authentication_token, unique: true
  end
end
