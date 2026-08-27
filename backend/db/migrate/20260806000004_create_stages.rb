class CreateStages < ActiveRecord::Migration[8.0]
  def change
    create_table :stages, id: :uuid do |t|
      t.string :slug, null: false
      t.string :part, null: false
      t.integer :stage_number, null: false
      t.string :title, null: false
      t.text :description

      t.timestamps
    end

    add_index :stages, :slug, unique: true
  end
end
