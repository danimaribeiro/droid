class CreateTestRuns < ActiveRecord::Migration[8.0]
  def change
    create_table :test_runs, id: :uuid do |t|
      t.references :submission, type: :uuid, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.text :compile_logs
      t.integer :total_passed, default: 0
      t.integer :total_failed, default: 0
      t.integer :duration_ms, default: 0
      t.datetime :executed_at

      t.timestamps
    end
  end
end
