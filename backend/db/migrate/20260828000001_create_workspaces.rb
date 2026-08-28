class CreateWorkspaces < ActiveRecord::Migration[8.0]
  def change
    create_table :workspaces, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :stage_slug, null: false
      t.string :language_slug, null: false
      t.jsonb :code_files, null: false, default: {}

      t.timestamps
    end

    add_index :workspaces, [:user_id, :stage_slug, :language_slug], unique: true, name: "idx_workspaces_user_stage_lang"
  end
end
