stages = [
  # Part 1 (Core Engine)
  { slug: "database/repl", part: "database", stage_number: 1, title: "User REPL", description: "Build an interactive Read-Eval-Print Loop accepting .exit command." },
  { slug: "database/lexer", part: "database", stage_number: 2, title: "SQL Lexer", description: "Tokenize SQL strings into structured keyword, identifier, and string literal tokens." },
  { slug: "database/parser", part: "database", stage_number: 3, title: "SQL Parser", description: "Parse token streams into AST representation for SELECT and INSERT queries." },
  { slug: "database/row-serialization", part: "database", stage_number: 4, title: "Row Serialization", description: "Serialize structured rows into compact binary memory representation." },
  { slug: "database/pager", part: "database", stage_number: 5, title: "Pager & Buffer Pool", description: "Manage fixed-size 4KB disk pages with in-memory buffer pool." },
  { slug: "database/btree-leaf", part: "database", stage_number: 6, title: "B-Tree Leaf Node & INSERT", description: "Store records sorted in B-Tree leaf node structures." },
  { slug: "database/btree-search", part: "database", stage_number: 7, title: "B-Tree Search & SELECT", description: "Binary search leaf nodes to execute SELECT queries." },
  { slug: "database/btree-split", part: "database", stage_number: 8, title: "B-Tree Splits & Internal Nodes", description: "Handle node overflow by splitting leaf nodes and introducing internal routing nodes." },
  { slug: "database/persistence", part: "database", stage_number: 9, title: "Persistence & WHERE Clause", description: "Persist B-Tree state across sessions and filter rows via WHERE clause." },
  { slug: "database/planner", part: "database", stage_number: 10, title: "Query Planner & Executor", description: "Volcano model iterator based execution for queries." },
  { slug: "database/index-scan", part: "database", stage_number: 11, title: "Index Scan", description: "B-Tree index lookup optimization for primary key searches." },
  { slug: "database/delete-update", part: "database", stage_number: 12, title: "Delete & Update", description: "Support DELETE and UPDATE statements on B-Tree storage." },

  # Part 2 (Advanced Storage & Transactions)
  { slug: "advanced-storage/wal", part: "advanced-storage", stage_number: 1, title: "WAL & Crash Recovery", description: "Write-Ahead Logging for durability and crash recovery." },
  { slug: "advanced-storage/commit", part: "advanced-storage", stage_number: 2, title: "Transaction Commit", description: "ACID transaction commit handling." },
  { slug: "advanced-storage/rollback", part: "advanced-storage", stage_number: 3, title: "Transaction Rollback", description: "Transaction undo logs and rollback handling." },
  { slug: "advanced-storage/create-table", part: "advanced-storage", stage_number: 4, title: "Create Table", description: "Dynamic table schema creation." },
  { slug: "advanced-storage/schema-validation", part: "advanced-storage", stage_number: 5, title: "Schema Validation", description: "Data type and constraint validation." },
  { slug: "advanced-storage/varlen-serialization", part: "advanced-storage", stage_number: 6, title: "Varlen Serialization", description: "Variable-length VARCHAR field serialization." },
  { slug: "advanced-storage/slotted-page", part: "advanced-storage", stage_number: 7, title: "Slotted Page", description: "Slotted page architecture for variable length records." },
  { slug: "advanced-storage/varlen-btree", part: "advanced-storage", stage_number: 8, title: "Varlen B-Tree", description: "B-Tree implementation supporting variable length keys." }
]

stages.each do |stage_attrs|
  Stage.find_or_create_by!(slug: stage_attrs[:slug]) do |s|
    s.part = stage_attrs[:part]
    s.stage_number = stage_attrs[:stage_number]
    s.title = stage_attrs[:title]
    s.description = stage_attrs[:description]
  end
end

puts "Seeded #{Stage.count} tutorial stages across parts."

admin = User.find_or_create_by!(email: "admin@droid.dev") do |u|
  u.name = "Admin"
  u.password = "admin"
  u.password_confirmation = "admin"
  u.admin = true
end

puts "Admin user: #{admin.email} / admin"
