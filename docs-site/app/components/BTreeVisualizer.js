"use client";

import { useState } from "react";
import { useTheme } from "./ThemeContext";

export default function BTreeVisualizer({ slug }) {
  const btreeStages = ["stage6-btree-leaf", "stage7-btree-search", "stage8-btree-split"];
  if (!btreeStages.includes(slug)) return null;

  const { isGlass } = useTheme();
  const [selectedCell, setSelectedCell] = useState(0);
  const [hasShifted, setHasShifted] = useState(false);
  const [insertedKey2, setInsertedKey2] = useState(false);
  const [isSplit, setIsSplit] = useState(false);

  const sampleCells = [
    { idx: 0, key: 1, offset: "0x0008", name: "danimar", email: "danimar@email.com", bytes: 64 },
    { idx: 1, key: 2, offset: "0x0048", name: "alice", email: "alice@tech.com", bytes: 64 },
    { idx: 2, key: 3, offset: "0x0088", name: "bob", email: "bob@tech.com", bytes: 64 },
    { idx: 3, key: 42, offset: "0x00C8", name: "linus", email: "linus@linux.org", bytes: 64 },
  ];

  const panelCls = isGlass
    ? "bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
    : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700";

  const badgeCls = isGlass
    ? "text-[10px] font-bold tracking-wider uppercase text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-lg inline-block"
    : "text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg inline-block";

  const btnPrimary = isGlass
    ? "px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/30 text-purple-200 hover:bg-purple-500/40 border border-purple-500/20 transition-colors"
    : "px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors";

  const btnSecondary = isGlass
    ? "px-4 py-2 rounded-lg text-sm font-medium bg-white/[0.08] text-gray-300 hover:bg-white/[0.12] border border-white/[0.10] transition-colors"
    : "px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors";

  const textPrimary = isGlass ? "text-white" : "text-gray-900 dark:text-white";
  const textMuted = isGlass ? "text-gray-400" : "text-gray-500 dark:text-gray-400";

  return (
    <div className={`rounded-xl my-6 overflow-hidden ${panelCls}`}>
      {/* Header */}
      <div className={`px-6 py-5 border-b ${isGlass ? "border-white/[0.08]" : "border-gray-200 dark:border-gray-700"}`}>
        <span className={badgeCls}>Interactive Algorithm Lab</span>
        <h2 className={`text-lg font-semibold mt-3 ${textPrimary}`}>
          {slug === "stage6-btree-leaf" && "4KB Leaf Node & 64-Byte Cell Inspector"}
          {slug === "stage7-btree-search" && "Logarithmic Search & Sorted Memory Shifting"}
          {slug === "stage8-btree-split" && "B+Tree Leaf Splitting & Root Promotion Simulator"}
        </h2>
        <p className={`text-sm mt-1 ${textMuted}`}>
          Interact directly with simulated memory layouts to visualize how relational tuples reside within our B+Tree architecture.
        </p>
      </div>

      {/* Stage 6: Memory Map Inspector */}
      {slug === "stage6-btree-leaf" && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`text-[10px] font-mono px-2 py-1 rounded ${isGlass ? "bg-green-500/20 text-green-300" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"}`}>
              BUFFER POOL: PAGE #0 (4096 BYTES)
            </span>
            <span className={`text-[10px] font-mono px-2 py-1 rounded ${isGlass ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"}`}>
              NODE TYPE: LEAF (0x00)
            </span>
            <span className={`text-[10px] font-mono px-2 py-1 rounded ${isGlass ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"}`}>
              IS ROOT: TRUE
            </span>
            <span className={`text-[10px] font-mono px-2 py-1 rounded ${isGlass ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`}>
              NUM CELLS: 4 / ~63 MAX
            </span>
          </div>

          <p className={`text-sm ${textMuted}`}>Click on a cell to inspect raw 64-byte tuple decoding:</p>

          {/* Memory layout grid */}
          <div className="space-y-2">
            <div className={`rounded-lg px-4 py-2.5 text-xs font-mono ${
              isGlass ? "bg-white/[0.05] text-gray-300 border border-white/[0.08]" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            }`}>
              <strong>Node Header (8 Bytes)</strong> — [Type | Root | Cell Count]
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {sampleCells.map((cell, i) => (
                <button
                  key={i}
                  className={`rounded-lg p-3 text-left transition-all cursor-pointer border ${
                    selectedCell === i
                      ? isGlass
                        ? "bg-purple-500/20 border-purple-400/30 ring-1 ring-purple-400/20"
                        : "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 ring-1 ring-blue-300 dark:ring-blue-600"
                      : isGlass
                        ? "bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08]"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750"
                  }`}
                  onClick={() => setSelectedCell(i)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono ${textMuted}`}>Cell #{cell.idx}</span>
                    <span className={`text-xs font-semibold ${
                      selectedCell === i
                        ? isGlass ? "text-purple-300" : "text-blue-600 dark:text-blue-400"
                        : textPrimary
                    }`}>Key: {cell.key}</span>
                  </div>
                  <div className={`text-[10px] font-mono ${textMuted}`}>
                    60B Row Payload — <code>{cell.offset}</code>
                  </div>
                </button>
              ))}
            </div>

            <div className={`rounded-lg px-4 py-3 text-xs font-mono text-center ${
              isGlass ? "bg-white/[0.03] text-gray-500 border border-white/[0.06] border-dashed" : "bg-gray-50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 border-dashed"
            }`}>
              Unoccupied Tail Memory (3840 Bytes) — Ready for ~59 additional cells
            </div>
          </div>

          {/* Inspector drawer */}
          <div className={`rounded-lg p-4 space-y-2 ${
            isGlass ? "bg-white/[0.06] border border-white/[0.10]" : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          }`}>
            <div className={`text-xs font-semibold ${textPrimary}`}>
              Hex Inspector — Cell #{selectedCell}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { label: "Memory Offset", value: `${sampleCells[selectedCell].offset} (within 4096-byte frame)` },
                { label: "Primary Key (4 Bytes)", value: `${sampleCells[selectedCell].key} (Unsigned 32-bit int)` },
                { label: "Row Payload (60 Bytes)", value: `id=${sampleCells[selectedCell].key} | name='${sampleCells[selectedCell].name}' | email='${sampleCells[selectedCell].email}'` },
              ].map((item) => (
                <div key={item.label}>
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${textMuted}`}>{item.label}</div>
                  <code className={`text-xs ${isGlass ? "text-green-300" : "text-green-700 dark:text-green-400"}`}>{item.value}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage 7: Sorted Shifter */}
      {slug === "stage7-btree-search" && (
        <div className="p-6 space-y-4">
          <div>
            <h3 className={`text-sm font-semibold ${textPrimary}`}>Scenario: Inserting Out-of-Order Key #2 into [Key 1, Key 3]</h3>
            <p className={`text-sm mt-1 ${textMuted}`}>
              In a B+Tree leaf, cells must never be appended out of numerical sequence. Observe how overlapping memory moves shift existing cells rightward by 64 bytes to guarantee fast O(log N) binary search!
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setHasShifted(false); setInsertedKey2(false); }} className={btnSecondary}>
              Reset
            </button>
            <button
              onClick={() => { if (!hasShifted) setHasShifted(true); else if (!insertedKey2) setInsertedKey2(true); }}
              disabled={hasShifted && insertedKey2}
              className={`${btnPrimary} disabled:opacity-50`}
            >
              {!hasShifted
                ? "Step 1: Execute 64-Byte Rightward Shift"
                : !insertedKey2
                  ? "Step 2: Deposit Key #2 into Vacated Slot"
                  : "Sorted Insertion Complete!"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Index #0 */}
            <div className="space-y-1">
              <div className={`text-[10px] font-mono text-center ${textMuted}`}>Index #0</div>
              <div className={`rounded-lg p-3 text-center ${
                isGlass ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40"
              }`}>
                <div className={`text-sm font-semibold ${isGlass ? "text-green-300" : "text-green-700 dark:text-green-400"}`}>Key: 1</div>
                <div className={`text-[10px] ${textMuted}`}>60-byte row: id=1</div>
              </div>
            </div>

            {/* Index #1 */}
            <div className="space-y-1">
              <div className={`text-[10px] font-mono text-center ${textMuted}`}>Index #1</div>
              {!hasShifted ? (
                <div className={`rounded-lg p-3 text-center ${
                  isGlass ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40"
                }`}>
                  <div className={`text-sm font-semibold ${isGlass ? "text-amber-300" : "text-amber-700 dark:text-amber-400"}`}>Key: 3 (Must Shift!)</div>
                  <div className={`text-[10px] ${textMuted}`}>60-byte row: id=3</div>
                </div>
              ) : !insertedKey2 ? (
                <div className={`rounded-lg p-3 text-center animate-pulse ${
                  isGlass ? "bg-amber-500/15 border border-amber-500/25 border-dashed" : "bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 border-dashed"
                }`}>
                  <div className={`text-sm font-semibold ${isGlass ? "text-amber-300" : "text-amber-600 dark:text-amber-400"}`}>Vacated 64-Byte Slot</div>
                  <div className={`text-[10px] ${textMuted}`}>Waiting for Key #2...</div>
                </div>
              ) : (
                <div className={`rounded-lg p-3 text-center ${
                  isGlass ? "bg-blue-500/15 border border-blue-500/25" : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40"
                }`}>
                  <div className={`text-sm font-semibold ${isGlass ? "text-blue-300" : "text-blue-700 dark:text-blue-400"}`}>Key: 2 (Inserted!)</div>
                  <div className={`text-[10px] ${textMuted}`}>60-byte row: id=2</div>
                </div>
              )}
            </div>

            {/* Index #2 */}
            <div className="space-y-1">
              <div className={`text-[10px] font-mono text-center ${textMuted}`}>Index #2</div>
              {!hasShifted ? (
                <div className={`rounded-lg p-3 text-center ${
                  isGlass ? "bg-white/[0.04] border border-white/[0.06] border-dashed" : "bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 border-dashed"
                }`}>
                  <div className={`text-sm ${textMuted}`}>[Empty]</div>
                </div>
              ) : (
                <div className={`rounded-lg p-3 text-center ${
                  isGlass ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40"
                }`}>
                  <div className={`text-sm font-semibold ${isGlass ? "text-green-300" : "text-green-700 dark:text-green-400"}`}>Key: 3 (Shifted +64B)</div>
                  <div className={`text-[10px] ${textMuted}`}>60-byte row: id=3</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stage 8: Split & Root Promotion */}
      {slug === "stage8-btree-split" && (
        <div className="p-6 space-y-4">
          <div>
            <h3 className={`text-sm font-semibold ${textPrimary}`}>B+Tree Split Protocol: Promoting Routing Keys vs Retaining Payloads</h3>
            <p className={`text-sm mt-1 ${textMuted}`}>
              Unlike standard B-Trees, a B+Tree keeps 100% of full 60-byte table records inside leaf nodes and promotes exclusively a compact 4-byte copy of the median separator key upward!
            </p>
          </div>

          <button onClick={() => setIsSplit(!isSplit)} className={btnPrimary}>
            {!isSplit ? "Simulate Leaf Overflow & Execute Split" : "Revert to Single Root Leaf"}
          </button>

          {!isSplit ? (
            <div className={`rounded-xl p-4 ${
              isGlass ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40"
            }`}>
              <div className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-3 ${
                isGlass ? "text-amber-300" : "text-amber-700 dark:text-amber-400"
              }`}>
                PAGE #0 (TYPE: LEAF | IS_ROOT: TRUE | DEPTH: 1)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
                  <span key={k} className={`text-[10px] font-mono px-2 py-1 rounded ${
                    isGlass ? "bg-white/[0.08] text-gray-300" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}>
                    Key {k} [60B]
                  </span>
                ))}
                <span className={`text-[10px] font-mono px-2 py-1 rounded ${
                  isGlass ? "bg-red-500/20 text-red-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}>
                  Key 9 Incoming (Overflow!)
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Internal root */}
              <div className={`rounded-xl p-4 text-center ${
                isGlass ? "bg-purple-500/15 border border-purple-500/25" : "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40"
              }`}>
                <div className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-2 ${
                  isGlass ? "text-purple-300" : "text-purple-700 dark:text-purple-400"
                }`}>
                  NEW INTERNAL ROOT: PAGE #0 (DEPTH: 2)
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <span className={`text-xs font-mono ${textMuted}`}>Left Child &rarr; Page #1</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                    isGlass ? "bg-purple-500/30 text-purple-200" : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                  }`}>
                    Promoted Key: 5 (4-byte copy only!)
                  </span>
                  <span className={`text-xs font-mono ${textMuted}`}>Right Child &rarr; Page #2</span>
                </div>
              </div>

              {/* Leaf children */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 ${
                  isGlass ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/40"
                }`}>
                  <div className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-2 ${
                    isGlass ? "text-green-300" : "text-green-700 dark:text-green-400"
                  }`}>
                    LEFT LEAF: PAGE #1 (Keys &lt; 5)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4].map((k) => (
                      <span key={k} className={`text-[10px] font-mono px-2 py-1 rounded ${
                        isGlass ? "bg-white/[0.08] text-gray-300" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}>
                        Key {k} [60B]
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`rounded-xl p-4 ${
                  isGlass ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/40"
                }`}>
                  <div className={`text-[10px] font-mono font-bold tracking-wider uppercase mb-2 ${
                    isGlass ? "text-green-300" : "text-green-700 dark:text-green-400"
                  }`}>
                    RIGHT LEAF: PAGE #2 (Keys &ge; 5)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 6, 7, 8, 9].map((k) => (
                      <span key={k} className={`text-[10px] font-mono px-2 py-1 rounded ${
                        k === 5
                          ? isGlass ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30" : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-600"
                          : isGlass ? "bg-white/[0.08] text-gray-300" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}>
                        Key {k} [60B{k === 5 ? " Authentic!" : ""}]
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
