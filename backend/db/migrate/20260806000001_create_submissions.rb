class CreateSubmissions < ActiveRecord::Migration[8.0]
  def change
    create_table :submissions, id: :uuid do |t|
      t.string :stage_slug, null: false
      t.string :language_slug, null: false
      t.jsonb :code_files, null: false, default: {}
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :submissions, :stage_slug
    add_index :submissions, :language_slug
    add_index :submissions, :status
  end
end
