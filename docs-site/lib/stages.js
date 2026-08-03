import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");
const STAGES_DIR = path.join(process.cwd(), "..", "tests", "integration");

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
  { file: "STAGE12_VARLEN_SERIALIZATION_TEST_PLAN.md", num: 12, part: 2 },
  { file: "STAGE13_SLOTTED_PAGE_TEST_PLAN.md", num: 13, part: 2 },
  { file: "STAGE14_VARLEN_BTREE_TEST_PLAN.md", num: 14, part: 2 },
  { file: "STAGE15_CREATE_TABLE_TEST_PLAN.md", num: 15, part: 2 },
  { file: "STAGE16_SCHEMA_VALIDATION_TEST_PLAN.md", num: 16, part: 2 },
  { file: "STAGE17_TRANSACTION_COMMIT_TEST_PLAN.md", num: 17, part: 2 },
  { file: "STAGE18_TRANSACTION_ROLLBACK_TEST_PLAN.md", num: 18, part: 2 },
  { file: "STAGE19_WAL_TEST_PLAN.md", num: 19, part: 2 },
  { file: "STAGE20_DELETE_UPDATE_TEST_PLAN.md", num: 20, part: 3 },
  { file: "STAGE21_ADVANCED_WHERE_TEST_PLAN.md", num: 21, part: 3 },
  { file: "STAGE22_ORDER_BY_TEST_PLAN.md", num: 22, part: 3 },
  { file: "STAGE23_LIMIT_OFFSET_TEST_PLAN.md", num: 23, part: 3 },
  { file: "STAGE24_AGGREGATIONS_TEST_PLAN.md", num: 24, part: 3 },
  { file: "STAGE25_SECONDARY_INDEXES_TEST_PLAN.md", num: 25, part: 4 },
  { file: "STAGE26_COST_OPTIMIZER_TEST_PLAN.md", num: 26, part: 4 },
  { file: "STAGE27_VACUUM_TEST_PLAN.md", num: 27, part: 4 },
  { file: "STAGE28_JOINS_NESTED_LOOP_TEST_PLAN.md", num: 28, part: 5 },
  { file: "STAGE29_HASH_JOIN_TEST_PLAN.md", num: 29, part: 5 },
  { file: "STAGE30_FOREIGN_KEYS_TEST_PLAN.md", num: 30, part: 5 },
  { file: "STAGE31_SUBQUERIES_TEST_PLAN.md", num: 31, part: 5 },
  { file: "STAGE32_LOCK_MANAGER_TEST_PLAN.md", num: 32, part: 6 },
  { file: "STAGE33_MVCC_TEST_PLAN.md", num: 33, part: 6 },
  { file: "STAGE34_DEADLOCK_DETECTION_TEST_PLAN.md", num: 34, part: 6 },
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
  1: "Build a working database from scratch with REPL, SQL parser, fixed-size rows, B-tree storage, and a query planner.",
  2: "Evolve to variable-length storage, slotted pages, CREATE TABLE with schema catalog, and full transaction support with WAL.",
  3: "Implement DELETE, UPDATE, advanced WHERE expressions, ORDER BY, LIMIT/OFFSET, and aggregate functions.",
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

export function getStages() {
  return STAGE_ORDER.map((entry) => {
    const filePath = path.join(STAGES_DIR, entry.file);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    // Build slug: try tutorial slug first, else derive from filename
    const tutorialSlug = `stage${entry.num}-${extractSlug(entry.file).replace(`stage${entry.num}-`, "")}`;
    const slug = TUTORIAL_SLUGS.includes(tutorialSlug) ? tutorialSlug : extractSlug(entry.file);
    return {
      slug,
      num: entry.num,
      part: entry.part,
      title: extractTitle(content),
      summary: extractFirstSection(content),
      content,
      hasTutorial: TUTORIAL_SLUGS.includes(tutorialSlug),
    };
  }).filter(Boolean);
}

export function getExtras() {
  return EXTRAS_ORDER.map((file) => {
    const filePath = path.join(STAGES_DIR, file);
    if (!fs.existsSync(filePath)) return null;
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
