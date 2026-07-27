"use client";

import { useState } from "react";

const SCRIPT_TABS = [
  {
    id: "tokenize",
    name: "1. Lexer Debug",
    command: "droid > tokenize SELECT id, name FROM users WHERE id = 1;",
    output: `[KEYWORD - select]
[IDENTIFIER - id]
[SYMBOL - ,]
[IDENTIFIER - name]
[KEYWORD - from]
[IDENTIFIER - users]
[KEYWORD - where]
[IDENTIFIER - id]
[SYMBOL - =]
[NUMBER - 1]
[SYMBOL - ;]`
  },
  {
    id: "ast",
    name: "2. AST Parser",
    command: "droid > ast INSERT INTO users (id, name) VALUES (10, 'dan');",
    output: `[Statement: INSERT]
 ├─ Table: users
 ├─ Columns: [id, name]
 └─ Values:
     ├─ INT: 10
     └─ STRING: 'dan'
[Status: Syntax ValidATED]`
  },
  {
    id: "btree",
    name: "3. B-Tree Storage",
    command: "droid > btree dump 0",
    output: `[Page 0 - LEAF NODE]
 ├─ Header: { type: LEAF, cells: 3, next_leaf: 1 }
 ├─ Cell 0: Key = 1, Payload Offset = 0x1A0
 ├─ Cell 1: Key = 5, Payload Offset = 0x170
 └─ Cell 2: Key = 10, Payload Offset = 0x140
[Buffer Pool: Page Hit (100%)]`
  },
  {
    id: "explain",
    name: "4. Query Plan",
    command: "droid > explain SELECT * FROM users WHERE id = 5;",
    output: `[Execution Plan - Volcano Engine]
 └─ IndexScan (Table: users, Index: pk_id)
     ├─ Filter: id == 5
     └─ Estimated Cost: 1.2 disk I/O pages
[Execution completed in 0.4ms]`
  }
];

export default function TerminalPreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="terminal-window">
      {/* Top Window Header */}
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-close" />
          <span className="dot dot-minimize" />
          <span className="dot dot-maximize" />
        </div>
        <div className="terminal-title">droid-repl — bash — 80x24</div>
        <div className="terminal-badge">LIVE DEMO</div>
      </div>

      {/* Tabs */}
      <div className="terminal-tabs">
        {SCRIPT_TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(i)}
            className={`terminal-tab-btn ${activeTab === i ? "active" : ""}`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="terminal-body">
        <div className="terminal-prompt-line">
          <span className="prompt-dir">$</span>
          <span className="prompt-cmd">./c-droid/build/droid --db tutorial.db</span>
        </div>
        <div className="terminal-prompt-line mt-2">
          <span className="prompt-active">{SCRIPT_TABS[activeTab].command}</span>
        </div>
        <pre className="terminal-output">
          {SCRIPT_TABS[activeTab].output}
        </pre>
      </div>
    </div>
  );
}
