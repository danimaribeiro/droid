import { interpolate, useCurrentFrame } from "remotion";

export const MONO = '"SF Mono", Menlo, Monaco, Consolas, monospace';

export const COLORS = {
  plain: "#d6d3e0",
  comment: "#6f6885",
  string: "#7ee2b8",
  number: "#f0b866",
  keyword: "#c792ea",
  constant: "#82aaff",
  symbol: "#f78c6c",
  punct: "#8b849e",
};

// Small hand-rolled highlighter. The snippets shown in this video are fixed and
// known, so a per-line tokenizer is enough — and cheaper than pulling in a
// full grammar-based highlighter.
const RULES = {
  ruby: [
    ["comment", "#[^\\n]*"],
    ["string", '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|%w\\[[^\\]]*\\]'],
    ["symbol", ":[a-zA-Z_]\\w*[?!]?"],
    [
      "keyword",
      "\\b(?:class|module|def|end|do|if|elsif|else|unless|return|self|nil|true|false|private|require|new|each)\\b",
    ],
    ["constant", "\\b[A-Z][A-Za-z0-9_]*\\b"],
    ["number", "\\b\\d[\\d_]*\\b"],
    ["punct", "[{}()\\[\\],.;:=><|&%!+*/-]"],
  ],
  python: [
    ["comment", "#[^\\n]*"],
    ["string", '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
    [
      "keyword",
      "\\b(?:from|import|def|class|return|if|else|elif|for|in|not|and|or|None|True|False|with|as)\\b",
    ],
    ["constant", "\\b[A-Z][A-Za-z0-9_]*\\b"],
    ["number", "\\b\\d[\\d_]*\\b"],
    ["punct", "[{}()\\[\\],.;:=><|&%!+*/-]"],
  ],
  bash: [
    ["comment", "#[^\\n]*"],
    ["string", '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\''],
    [
      "keyword",
      "\\b(?:set|export|mkdir|cd|then|if|fi|for|do|done|echo)\\b|\\bpython3\\b|\\bgcc\\b|\\bcargo\\b|\\bzig\\b",
    ],
    ["constant", "\\$[A-Za-z_]\\w*|\\b[A-Z][A-Z0-9_]{2,}\\b"],
    ["number", "\\b\\d[\\d_]*\\b"],
    ["punct", "[{}()\\[\\],.;:=><|&%!+*/-]"],
  ],
};

function tokenizeLine(line, lang) {
  const rules = RULES[lang] ?? RULES.ruby;
  const re = new RegExp(rules.map(([, src]) => `(${src})`).join("|"), "g");
  const tokens = [];
  let last = 0;

  for (const m of line.matchAll(re)) {
    if (m.index > last) {
      tokens.push({ type: "plain", text: line.slice(last, m.index) });
    }
    const group = m.slice(1).findIndex((g) => g !== undefined);
    tokens.push({ type: rules[group][0], text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    tokens.push({ type: "plain", text: line.slice(last) });
  }
  return tokens;
}

/**
 * Code panel with a filename header, line numbers and a staggered per-line
 * reveal. `highlight` takes 1-based line numbers to accent.
 */
export function CodePanel({
  filename,
  language = "ruby",
  code,
  highlight = [],
  fontSize = 26,
  startAt = 0,
  fitHeight = 810,
  style,
}) {
  const frame = useCurrentFrame();
  const lines = code.replace(/\n$/, "").split("\n");
  const accented = new Set(highlight);

  // Scenes are a fixed height, so shrink the type rather than let a long
  // snippet run off the bottom of the frame.
  const size = Math.min(fontSize, (fitHeight - 90) / (lines.length * 1.72));

  return (
    <div
      style={{
        background: "rgba(18, 13, 32, 0.92)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 25px 70px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 22px",
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ display: "flex", gap: 7 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div
              key={c}
              style={{ width: 11, height: 11, borderRadius: "50%", background: c }}
            />
          ))}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 18,
            color: "rgba(255,255,255,0.62)",
            marginLeft: 6,
          }}
        >
          {filename}
        </div>
      </div>

      <div style={{ padding: "20px 0" }}>
        {lines.map((line, i) => {
          const appear = interpolate(
            frame - startAt - i * 1.6,
            [0, 9],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const isAccent = accented.has(i + 1);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                opacity: appear,
                transform: `translateX(${interpolate(appear, [0, 1], [14, 0])}px)`,
                background: isAccent ? "rgba(199,146,234,0.12)" : "transparent",
                borderLeft: `3px solid ${
                  isAccent ? "rgba(199,146,234,0.75)" : "transparent"
                }`,
                padding: "1px 22px 1px 19px",
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: size * 0.82,
                  color: "rgba(255,255,255,0.22)",
                  width: 44,
                  flexShrink: 0,
                  textAlign: "right",
                  marginRight: 20,
                  lineHeight: 1.62,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: size,
                  lineHeight: 1.62,
                  whiteSpace: "pre",
                  color: COLORS.plain,
                }}
              >
                {tokenizeLine(line, language).map((t, j) => (
                  <span key={j} style={{ color: COLORS[t.type] ?? COLORS.plain }}>
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
