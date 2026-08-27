class CreateTestCaseResults < ActiveRecord::Migration[8.0]
  def change
    create_table :test_case_results, id: :uuid do |t|
      t.references :test_run, type: :uuid, null: false, foreign_key: true
      t.string :case_name, null: false
      t.boolean :passed, null: false, default: false
      t.text :input_given
      t.text :expected_output
      t.text :actual_output
      t.integer :exit_code
      t.text :failure_reason

      t.timestamps
    end

    add_index :test_case_results, :passed
  end
end
