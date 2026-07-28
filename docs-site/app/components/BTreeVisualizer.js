"use client";

import { useState } from "react";

export default function BTreeVisualizer({ slug }) {
  // We only render this specialized interactive lab for B+Tree stages
  const btreeStages = ["stage6-btree-leaf", "stage7-btree-search", "stage8-btree-split"];
  if (!btreeStages.includes(slug)) return null;

  // Interactive states for Stage 6 (Memory Map Inspector)
  const [selectedCell, setSelectedCell] = useState(0);

  // Interactive states for Stage 7 (Memory Shift Simulator)
  const [hasShifted, setHasShifted] = useState(false);
  const [insertedKey2, setInsertedKey2] = useState(false);

  // Interactive states for Stage 8 (Split & Promotion Simulator)
  const [isSplit, setIsSplit] = useState(false);

  // Sample cell inventory for demonstration
  const sampleCells = [
    { idx: 0, key: 1, offset: "0x0008", name: "danimar", email: "danimar@email.com", bytes: 64 },
    { idx: 1, key: 2, offset: "0x0048", name: "alice", email: "alice@tech.com", bytes: 64 },
    { idx: 2, key: 3, offset: "0x0088", name: "bob", email: "bob@tech.com", bytes: 64 },
    { idx: 3, key: 42, offset: "0x00C8", name: "linus", email: "linus@linux.org", bytes: 64 },
  ];

  return (
    <div className="btree-lab-container fade-in">
      <div className="btree-lab-header">
        <span className="btree-lab-badge">⚡ INTERACTIVE ALGORITHM LAB & VISUALIZER</span>
        <h2 className="btree-lab-title">
          {slug === "stage6-btree-leaf" && "🧩 4KB Leaf Node & 64-Byte Cell Inspector"}
          {slug === "stage7-btree-search" && "🚀 Logarithmic Search & Sorted Memory Shifting"}
          {slug === "stage8-btree-split" && "🌳 B+Tree Leaf Splitting & Root Promotion Simulator"}
        </h2>
        <p className="btree-lab-desc">
          Interact directly with simulated memory layouts to visualize how relational tuples reside within our B+Tree architecture.
        </p>
      </div>

      {/* ── STAGE 6: MEMORY MAP INSPECTOR ── */}
      {slug === "stage6-btree-leaf" && (
        <div className="lab-stage6-box">
          <div className="memory-card-header">
            <div className="header-meta">
              <span className="tag-page">BUFFER POOL: PAGE #0 (4096 BYTES)</span>
              <span className="tag-type">NODE TYPE: LEAF (0x00)</span>
              <span className="tag-root">IS ROOT: TRUE</span>
              <span className="tag-cells">NUM CELLS: 4 / ~63 MAX</span>
            </div>
            <p className="hint-text">👉 Click or hover on individual cell memory frames below to inspect raw 64-byte tuple decoding:</p>
          </div>

          <div className="memory-layout-grid">
            <div className="memory-block-header">
              <strong>Node Header (8 Bytes)</strong>
              <span>[Type | Root | Cell Count]</span>
            </div>

            {sampleCells.map((cell, i) => (
              <div
                key={i}
                className={`memory-block-cell ${selectedCell === i ? "active-cell" : ""}`}
                onClick={() => setSelectedCell(i)}
                onMouseEnter={() => setSelectedCell(i)}
              >
                <div className="cell-top-bar">
                  <span className="cell-idx">Cell #{cell.idx}</span>
                  <span className="cell-key">Key: {cell.key}</span>
                </div>
                <div className="cell-payload-summary">
                  <span>60B Row Payload</span>
                  <code className="cell-offset">Addr: {cell.offset}</code>
                </div>
              </div>
            ))}

            <div className="memory-block-free">
              <strong>Unoccupied Tail Memory (3840 Bytes)</strong>
              <span>Ready for ~59 additional sequential 64-byte row cells!</span>
            </div>
          </div>

          <div className="cell-inspector-drawer">
            <div className="drawer-title">🔍 Hex Inspector & 64-Byte Cell Dissection (Cell #{selectedCell})</div>
            <div className="drawer-grid">
              <div className="drawer-stat">
                <label>Memory Offset</label>
                <code>{sampleCells[selectedCell].offset} (within 4096-byte frame)</code>
              </div>
              <div className="drawer-stat">
                <label>Primary Key (4 Bytes)</label>
                <code className="val-key">{sampleCells[selectedCell].key} (Unsigned 32-bit int)</code>
              </div>
              <div className="drawer-stat">
                <label>Row Payload (60 Bytes)</label>
                <code>id={sampleCells[selectedCell].key} | name=&apos;{sampleCells[selectedCell].name}&apos; | email=&apos;{sampleCells[selectedCell].email}&apos;</code>
              </div>
              <div className="drawer-stat">
                <label>Architecture Guarantee</label>
                <span className="val-guarantee">✓ Authentic full table tuple residing safely inside bottom Leaf Node!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 7: SORTED SHIFTER & SEARCH SIMULATOR ── */}
      {slug === "stage7-btree-search" && (
        <div className="lab-stage7-box">
          <div className="shift-controls">
            <div className="shift-info">
              <h3>Scenario: Inserting Out-of-Order Key #2 into [Key 1, Key 3]</h3>
              <p>In a B+Tree leaf, cells must never be appended out of numerical sequence. Observe how overlapping memory moves shift existing cells rightward by 64 bytes to guarantee fast O(log N) binary search!</p>
            </div>
            <div className="shift-btn-group">
              <button
                onClick={() => { setHasShifted(false); setInsertedKey2(false); }}
                className="btn-lab-reset"
              >
                🔄 Reset Memory Buffer
              </button>
              <button
                onClick={() => {
                  if (!hasShifted) setHasShifted(true);
                  else if (!insertedKey2) setInsertedKey2(true);
                }}
                disabled={hasShifted && insertedKey2}
                className="btn-lab-action"
              >
                {!hasShifted
                  ? "⚡ Step 1: Execute 64-Byte Rightward Shift (vacate index #1)"
                  : !insertedKey2
                  ? "📥 Step 2: Deposit Key #2 into Vacated Slot"
                  : "✓ Sorted Insertion Complete!"}
              </button>
            </div>
          </div>

          <div className="shift-visual-area">
            <div className="shift-slot">
              <span className="slot-idx">Index #0</span>
              <div className="slot-card occupied">
                <strong>Key: 1</strong>
                <span>60-byte row: id=1</span>
              </div>
            </div>

            <div className="shift-slot">
              <span className="slot-idx">Index #1</span>
              {!hasShifted ? (
                <div className="slot-card occupied unshifted">
                  <strong>Key: 3 (Must Shift Right!)</strong>
                  <span>60-byte row: id=3</span>
                </div>
              ) : !insertedKey2 ? (
                <div className="slot-card vacated pulse-amber">
                  <strong>✨ Vacated 64-Byte Slot</strong>
                  <span>Waiting for incoming Key #2...</span>
                </div>
              ) : (
                <div className="slot-card new-insert fade-in">
                  <strong>🎉 Key: 2 (Inserted!)</strong>
                  <span>60-byte row: id=2</span>
                </div>
              )}
            </div>

            <div className="shift-slot">
              <span className="slot-idx">Index #2</span>
              {!hasShifted ? (
                <div className="slot-card empty">
                  <strong>[Empty Tail Memory]</strong>
                </div>
              ) : (
                <div className="slot-card occupied shifted fade-in">
                  <strong>Key: 3 (Shifted +64 Bytes)</strong>
                  <span>60-byte row: id=3</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 8: SPLIT & ROOT PROMOTION SIMULATOR ── */}
      {slug === "stage8-btree-split" && (
        <div className="lab-stage8-box">
          <div className="split-controls">
            <div className="split-info">
              <h3>B+Tree Split Protocol: Promoting Routing Keys vs Retaining Payloads</h3>
              <p>Unlike standard B-Trees that pull authentic user tuples into upper root branches, a high-performance B+Tree keeps 100% of full 60-byte table records inside leaf nodes and promotes exclusively a compact 4-byte copy of the median separator key upward!</p>
            </div>
            <button
              onClick={() => setIsSplit(!isSplit)}
              className="btn-lab-split"
            >
              {!isSplit ? "⚡ Simulate Leaf Capacity Overflow & Execute B+Tree Split" : "↩️ Revert to Single Root Leaf Node"}
            </button>
          </div>

          {!isSplit ? (
            <div className="tree-state-single fade-in">
              <div className="tree-node-leaf full-capacity">
                <div className="node-badge-top">BUFFER POOL PAGE #0 (TYPE: LEAF | IS_ROOT: TRUE | DEPTH: 1)</div>
                <div className="node-cells-flex">
                  <div className="mini-cell">Key 1 [60B]</div>
                  <div className="mini-cell">Key 2 [60B]</div>
                  <div className="mini-cell">Key 3 [60B]</div>
                  <div className="mini-cell">Key 4 [60B]</div>
                  <div className="mini-cell">Key 5 [60B]</div>
                  <div className="mini-cell">Key 6 [60B]</div>
                  <div className="mini-cell">Key 7 [60B]</div>
                  <div className="mini-cell">Key 8 [60B]</div>
                  <div className="mini-cell alert">⚠️ Key 9 Incoming (Overflow!)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="tree-state-split fade-in">
              <div className="tree-root-row">
                <div className="tree-node-internal">
                  <div className="node-badge-internal">NEW INTERNAL ROUTING ROOT: PAGE #0 (DEPTH: 2)</div>
                  <div className="internal-routing-body">
                    <span className="ptr-box">Left Child ──► Page #1</span>
                    <span className="sep-box pulse-purple">✨ Promoted Separator Key: 5 (Copy only, NO 60-byte payload!)</span>
                    <span className="ptr-box">Rightmost Child ──► Page #2</span>
                  </div>
                </div>
              </div>

              <div className="tree-connectors">
                <div className="connector-line left" />
                <div className="connector-line right" />
              </div>

              <div className="tree-leaves-row">
                <div className="tree-node-leaf child-leaf">
                  <div className="node-badge-leaf">LEFT LEAF CHILD: PAGE #1 (Keys &lt; 5)</div>
                  <div className="node-cells-flex">
                    <div className="mini-cell">Key 1 [60B]</div>
                    <div className="mini-cell">Key 2 [60B]</div>
                    <div className="mini-cell">Key 3 [60B]</div>
                    <div className="mini-cell">Key 4 [60B]</div>
                  </div>
                </div>

                <div className="tree-node-leaf child-leaf">
                  <div className="node-badge-leaf">RIGHT LEAF CHILD: PAGE #2 (Keys ≥ 5)</div>
                  <div className="node-cells-flex">
                    <div className="mini-cell highlight-cell">Key 5 [60B Authentic Tuple!]</div>
                    <div className="mini-cell">Key 6 [60B]</div>
                    <div className="mini-cell">Key 7 [60B]</div>
                    <div className="mini-cell">Key 8 [60B]</div>
                    <div className="mini-cell">Key 9 [60B]</div>
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
