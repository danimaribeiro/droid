import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");
const STAGES_DIR = path.join(process.cwd(), "..", "tests", "docs");

// Tutorial content slugs (with frontmatter)
const TUTORIAL_SLUGS = [
  "stage1-repl",
  "stage2-lexer",
  "stage3-parser",
  "stage4-serialization",
  "stage5-pager",
  "stage6-btree-leaf",
  "stage7-btree-search",
  "stage8-btree-split",
  "stage9-btree-internal-split",
  "stage10-persistence",
  "stage11-planner",
  "stage12-delete-update",
];

const STAGE_ORDER = [
  { file: "STAGE1_REPL_TEST_PLAN.md", num: 1, part: 1 },
  { file: "STAGE2_LEXER_TEST_PLAN.md", num: 2, part: 1 },
  { file: "STAGE3_PARSER_TEST_PLAN.md", num: 3, part: 1 },
  { file: "STAGE4_SERIALIZATION_TEST_PLAN.md", num: 4, part: 1 },
  { file: "STAGE5_PAGER_TEST_PLAN.md", num: 5, part: 1 },
  { file: "STAGE6_BTREE_LEAF_TEST_PLAN.md", num: 6, part: 1 },
  { file: "STAGE7_BTREE_SEARCH_TEST_PLAN.md", num: 7, part: 1 },
  { file: "STAGE8_BTREE_SPLIT_TEST_PLAN.md", num: 8, part: 1 },
  { file: "STAGE9_BTREE_INTERNAL_SPLIT_TEST_PLAN.md", num: 9, part: 1 },
  { file: "STAGE10_PERSISTENCE_TEST_PLAN.md", num: 10, part: 1 },
  { file: "STAGE11_PLANNER_TEST_PLAN.md", num: 11, part: 1 },
  { file: "STAGE12_DELETE_UPDATE_TEST_PLAN.md", num: 12, part: 1 },
  { file: "STAGE1_WAL_TEST_PLAN.md", num: 1, part: 2 },
  { file: "STAGE2_TRANSACTION_COMMIT_TEST_PLAN.md", num: 2, part: 2 },
  { file: "STAGE3_TRANSACTION_ROLLBACK_TEST_PLAN.md", num: 3, part: 2 },
  { file: "STAGE4_CREATE_TABLE_TEST_PLAN.md", num: 4, part: 2 },
  { file: "STAGE5_SCHEMA_VALIDATION_TEST_PLAN.md", num: 5, part: 2 },
  { file: "STAGE6_VARLEN_SERIALIZATION_TEST_PLAN.md", num: 6, part: 2 },
  { file: "STAGE7_SLOTTED_PAGE_TEST_PLAN.md", num: 7, part: 2 },
  { file: "STAGE8_VARLEN_BTREE_TEST_PLAN.md", num: 8, part: 2 },
  { file: "STAGE1_ADVANCED_WHERE_TEST_PLAN.md", num: 1, part: 3 },
  { file: "STAGE2_ORDER_BY_TEST_PLAN.md", num: 2, part: 3 },
  { file: "STAGE3_LIMIT_OFFSET_TEST_PLAN.md", num: 3, part: 3 },
  { file: "STAGE4_AGGREGATIONS_TEST_PLAN.md", num: 4, part: 3 },
  { file: "STAGE1_SECONDARY_INDEXES_TEST_PLAN.md", num: 1, part: 4 },
  { file: "STAGE2_COST_OPTIMIZER_TEST_PLAN.md", num: 2, part: 4 },
  { file: "STAGE3_VACUUM_TEST_PLAN.md", num: 3, part: 4 },
  { file: "STAGE1_JOINS_NESTED_LOOP_TEST_PLAN.md", num: 1, part: 5 },
  { file: "STAGE2_HASH_JOIN_TEST_PLAN.md", num: 2, part: 5 },
  { file: "STAGE3_FOREIGN_KEYS_TEST_PLAN.md", num: 3, part: 5 },
  { file: "STAGE4_SUBQUERIES_TEST_PLAN.md", num: 4, part: 5 },
  { file: "STAGE1_LOCK_MANAGER_TEST_PLAN.md", num: 1, part: 6 },
  { file: "STAGE2_MVCC_TEST_PLAN.md", num: 2, part: 6 },
  { file: "STAGE3_DEADLOCK_DETECTION_TEST_PLAN.md", num: 3, part: 6 },
];

const EXTRAS_ORDER = [
  "EXTRA_RESULT_SET_TEST_PLAN.md",
  "EXTRA_ERROR_HANDLING_TEST_PLAN.md",
  "EXTRA_WIRE_PROTOCOL_TEST_PLAN.md",
  "EXTRA_TYPE_SYSTEM_TEST_PLAN.md",
  "EXTRA_BUILTIN_FUNCTIONS_TEST_PLAN.md",
  "EXTRA_VIEWS_TEST_PLAN.md",
  "EXTRA_PREPARED_STATEMENTS_TEST_PLAN.md",
  "EXTRA_ALTER_TABLE_TEST_PLAN.md",
  "EXTRA_DROP_TRUNCATE_TEST_PLAN.md",
  "EXTRA_DISTINCT_SET_OPS_TEST_PLAN.md",
  "EXTRA_LSM_TREE_TEST_PLAN.md",
  "EXTRA_PAGE_COMPRESSION_TEST_PLAN.md",
  "EXTRA_EXPLAIN_ANALYZE_TEST_PLAN.md",
];

const PART_NAMES = {
  1: "Fixed-Layout Database",
  2: "Advanced Storage & Transactions",
  3: "Complete SQL",
  4: "Advanced Indexing",
  5: "Multi-Table & Relational",
  6: "Concurrency",
};

const PART_DESCRIPTIONS = {
  1: "Build a working database from scratch with REPL, SQL parser, fixed-size rows, B-tree storage, Volcano planner, and DELETE/UPDATE.",
  2: "Implement full transaction support with WAL, CREATE TABLE with schema catalog, and variable-length storage with slotted pages.",
  3: "Implement advanced WHERE expressions, ORDER BY, LIMIT/OFFSET, and aggregate functions.",
  4: "Add secondary indexes, a cost-based query optimizer, and VACUUM for space reclamation.",
  5: "Implement JOINs (nested loop and hash), foreign key constraints, and subqueries.",
  6: "Add a lock manager, Multi-Version Concurrency Control (MVCC), and deadlock detection.",
};

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].replace(/^Stage \d+:\s*/, "").replace(/^Extra Stage:\s*/, "") : "Untitled";
}

function extractSlug(filename) {
  return filename
    .replace("_TEST_PLAN.md", "")
    .toLowerCase()
    .replace(/_/g, "-");
}

function extractFirstSection(content) {
  const lines = content.split("\n");
  let collecting = false;
  let result = [];
  for (const line of lines) {
    if (line.startsWith("## ") && !collecting) {
      collecting = true;
      continue;
    }
    if (line.startsWith("## ") && collecting) break;
    if (collecting) result.push(line);
  }
  return result.join("\n").trim();
}

/**
 * Load tutorial content from content/ directory (with frontmatter).
 * Returns null if the file doesn't exist.
 */
export function getTutorialContent(slug) {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { ...data, bodyContent: content };
}

function findStageFile(filename, partNum = null) {
  let directPath = path.join(STAGES_DIR, filename);
  if (fs.existsSync(directPath)) return directPath;
  if (partNum) {
    let partPath = path.join(STAGES_DIR, `part${partNum}`, filename);
    if (fs.existsSync(partPath)) return partPath;
  }
  // Fallback search in all part folders
  for (let p = 1; p <= 6; p++) {
    let pPath = path.join(STAGES_DIR, `part${p}`, filename);
    if (fs.existsSync(pPath)) return pPath;
  }
  let extraPath = path.join(STAGES_DIR, "extras", filename);
  if (fs.existsSync(extraPath)) return extraPath;
  return null;
}

export function getStages() {
  return STAGE_ORDER.map((entry) => {
    const filePath = findStageFile(entry.file, entry.part);
    if (!filePath) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    const baseSlug = extractSlug(entry.file);
    const slug = entry.part > 1 ? `part${entry.part}-${baseSlug}` : baseSlug;
    return {
      slug,
      num: entry.num,
      part: entry.part,
      title: extractTitle(content),
      summary: extractFirstSection(content),
      content,
      hasTutorial: TUTORIAL_SLUGS.includes(slug),
    };
  }).filter(Boolean);
}

export function getExtras() {
  return EXTRAS_ORDER.map((file) => {
    const filePath = findStageFile(file);
    if (!filePath) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return {
      slug: extractSlug(file),
      title: extractTitle(content),
      summary: extractFirstSection(content),
      content,
    };
  }).filter(Boolean);
}

export function getStageBySlug(slug) {
  const allStages = [...getStages(), ...getExtras()];
  return allStages.find((s) => s.slug === slug) || null;
}

export function getAllSlugs() {
  const stages = getStages().map((s) => s.slug);
  const extras = getExtras().map((s) => s.slug);
  return [...stages, ...extras];
}

export function getPartInfo() {
  return Object.entries(PART_NAMES).map(([num, name]) => ({
    num: parseInt(num),
    name,
    description: PART_DESCRIPTIONS[num],
  }));
}

export { PART_NAMES, PART_DESCRIPTIONS };
