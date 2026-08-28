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
    <div className="rounded-xl overflow-hidden border border-white/[0.10] bg-gray-950 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-gray-500 font-mono">droid-repl — bash — 80x24</span>
        <span className="text-[9px] font-bold tracking-wider text-green-400 uppercase">Live Demo</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900/50">
        {SCRIPT_TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-2 text-[10px] font-medium transition-colors ${activeTab === i ? "text-blue-400 border-b-2 border-blue-400 bg-gray-800/50" : "text-gray-500 hover:text-gray-300"}`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-4 font-mono text-xs leading-relaxed min-h-[240px]">
        <div className="text-gray-500">
          <span className="text-green-400">$</span> <span className="text-gray-300">./c-droid/build/droid --db tutorial.db</span>
        </div>
        <div className="mt-3 text-yellow-300">{SCRIPT_TABS[activeTab].command}</div>
        <pre className="mt-2 text-gray-400 whitespace-pre-wrap">{SCRIPT_TABS[activeTab].output}</pre>
      </div>
    </div>
  );
}
