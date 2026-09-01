#!/bin/bash
set -e

VOICE="Samantha"
RATE=165
OUT="public/audio"
mkdir -p "$OUT"

generate() {
  local name="$1"
  local text="$2"

  say -v "$VOICE" -r "$RATE" "$text" -o "$OUT/${name}.aiff"
  afconvert -f m4af -d aac "$OUT/${name}.aiff" "$OUT/${name}.m4a"
  rm "$OUT/${name}.aiff"

  local dur
  dur=$(afinfo "$OUT/${name}.m4a" 2>/dev/null | grep "estimated duration" | awk '{print $3}')
  echo "  ✓ ${name}.m4a  (${dur}s)"
}

echo "Generating narration audio clips..."
echo ""

# Intro (over title card) — ~4s
generate "01-intro" \
  "Welcome to droid. An interactive tutorial where you build a database engine from scratch."

# Homepage screenshot — ~3s
generate "02-homepage" \
  "Start on the landing page. Choose from twelve stages covering lexing, parsing, B-trees, and more."

# Stage page — ~3s
generate "03-stage" \
  "Each stage has a tutorial lesson with clear objectives, core concepts, and a launch code editor button."

# Editor loads — ~4s
generate "04-editor-loads" \
  "The playground opens with a full code editor powered by Monaco. Your starter template is loaded automatically."

# Browsing files — ~3s
generate "05-browse-files" \
  "Browse your project files in the sidebar. Click any file to open it in a new editor tab."

# Auth modal — ~4s
generate "06-auth" \
  "Click Run Tests to submit your code. If you're not signed in yet, a login modal appears."

# Login — ~3s
generate "07-login" \
  "Enter your credentials and sign in. Your session persists across page reloads."

# Browsing logged in — ~3s
generate "08-browse-logged-in" \
  "Now logged in, explore your code files. The editor supports syntax highlighting for C, C++, Rust, and more."

# Submit code — ~4s
generate "09-submit" \
  "Click Run Tests to submit. A progress bar tracks each phase: submitting, compiling, and running tests."

# Results — ~5s
generate "10-results" \
  "The results panel shows which tests passed and which failed, with detailed input, expected output, and actual output for each test case."

# Typing code — ~4s
generate "11-typing" \
  "Edit your code right in the browser. The editor has full autocomplete, syntax highlighting, and multi-file support."

# Language switching — ~4s
generate "12-languages" \
  "Switch between C, C++, Rust, Zig, Python, or Ruby. Each language loads its own starter template."

# Outro — ~3s
generate "13-outro" \
  "Start building your database engine today at danimar dot dev slash droid."

echo ""
echo "Done! All audio clips in $OUT/"
