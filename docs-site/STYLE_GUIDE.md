# Droid — Glass Theme Style Guide

Design direction: frosted dark-glass panels floating over a deep purple gradient with colored
light orbs and a subtle diagonal crosshatch. Blue is the primary action color; purple is the
brand/identity accent; amber and green carry meaning inside the interactive labs.

This guide describes what the code in `app/` actually does. When you change a shared surface,
update the matching section here.

---

## Themes

Four themes, managed by `ThemeContext.js` and persisted to `localStorage` under `droid_theme`:

| Theme    | `isGlass` | `isDark` | Notes                                              |
|----------|-----------|----------|----------------------------------------------------|
| `glass`  | ✅        | ✅       | **Default.** Purple gradient + frosted panels        |
| `dark`   | —         | ✅       | Standard Tailwind `dark:` variants                   |
| `light`  | —         | —        | Standard light variants                              |
| `system` | —         | matches OS | Resolved via `prefers-color-scheme` at render time |

`useTheme()` exposes `{ theme, setTheme, isGlass, isDark }`. Glass implies dark, so
`dark:` variants still apply underneath it — several components deliberately reuse the dark
palette instead of writing a separate glass branch (see Pass/Fail below).

Components branch on `isGlass` inline. The common shorthands in the codebase are
`const g = isGlass` (page files) and hoisted class constants like `textPrimary`, `textMuted`,
`cardCls`, `inputCls`, `btnPrimary`, `btnSecondary` (component files) — prefer the hoisted
constants when a file has more than a handful of branches.

`ThemeSwitcher.js` renders the picker as a Preline dropdown with emoji labels:
☀️ Light · 🌙 Dark · 💻 System · ✦ Glass.

---

## Typography

| Role       | Family           | Weights    | Usage                    |
|------------|------------------|------------|--------------------------|
| UI / Body  | Inter            | 300–900    | All UI text              |
| Code       | JetBrains Mono   | 400–600    | Editor, code blocks      |

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap">
```

Loaded in both `app/(main)/layout.js` and `app/(variants)/layout.js`.

---

## CSS Stack

- **Tailwind CSS v3** — utility-first styling, `darkMode: "class"`
- **Preline UI** — dropdown behavior; imported dynamically (`import("preline/preline")`) in
  `ThemeSwitcher.js` and `Playground.js` after mount
- **`@tailwindcss/typography`** — `prose` classes for rendered Markdown
- `app/tailwind-variants.css` holds only the three `@tailwind` directives — there is no
  globals.css and no custom CSS layer. Everything else is utilities + inline `style` objects.
- Custom animation registered in `tailwind.config.js`: `animate-fade-in` (400ms `fadeIn`).
  Also in use: `animate-pulse`, `animate-spin`, and the one-shot `animate-[spin_0.4s_ease-out]`
  on the stage-unlock checkmark.

`tailwind.config.js` scans `app/(main)/**`, `app/(variants)/**`, and `app/components/*` —
a new top-level directory needs to be added there or its classes get purged.

---

## Background — Purple Gradient + Light Orbs

`GlassShell.js` owns the entire glass backdrop. Wrap a page in it rather than re-creating the
layers; it falls back to `bg-gray-50 dark:bg-gray-950` for the non-glass themes.

```jsx
style={{ background: "linear-gradient(135deg, #3d1f5c 0%, #2a1445 25%, #1a0e30 50%, #1a1030 75%, #2d1248 100%)" }}
```

### Colored light orbs (`fixed`, `pointer-events-none`, `rounded-full`)
```
Top-left      top-[-20%] left-[-15%]  w-[65%] h-[75%]  rgba(230,100,140,0.25) — pink/coral
Top-right     top-[-15%] right-[-10%] w-[50%] h-[55%]  rgba(240,170,110,0.18) — warm peach
Bottom-right  bottom-[-15%] right-[10%] w-[55%] h-[60%] rgba(140,80,220,0.20) — purple
```
Each is a `radial-gradient(circle, <rgba> 0%, transparent 55%)`.

### Diagonal crosshatch lines (`fixed inset-0` texture overlay)
```css
repeating-linear-gradient(135deg, transparent, transparent 48px, rgba(255,255,255,0.07) 48px, rgba(255,255,255,0.07) 49px),
repeating-linear-gradient(45deg,  transparent, transparent 48px, rgba(255,255,255,0.05) 48px, rgba(255,255,255,0.05) 49px)
```

Page content sits in a `relative z-10` wrapper above these layers.

---

## Glass Surface Tiers

White-alpha opacity is the depth scale. Pick the tier by role, not by taste:

| Tier   | Class                | Role                                                      |
|--------|----------------------|-----------------------------------------------------------|
| 0.14   | `bg-white/[0.14]`    | Topbar — the highest, most opaque chrome                   |
| 0.12   | `bg-white/[0.12]`    | Results panel, tab bar, active/selected item               |
| 0.10   | `bg-white/[0.10]`    | Primary floating panels (sidebars), page headers, hover-up |
| 0.08   | `bg-white/[0.08]`    | Content cards, ghost buttons, inputs                       |
| 0.06   | `bg-white/[0.06]`    | Secondary cards, segmented-control track, **hover state**  |
| 0.04–0.05 | `bg-white/[0.04]` `bg-white/[0.05]` | Disabled / locked / empty slots         |

Borders: `border-white/[0.12]` on panels, `border-white/[0.10]` on inner dividers and lighter
cards, `border-white/[0.08]` on separators, `border-white/[0.15]` on ghost buttons and inputs.

Inner glow: `shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]` on the topbar, `…0.08)]` on
sidebars and the results panel, `…0.06)]` on content cards and the editor pane.

Write the two-digit form `bg-white/[0.10]`, not `bg-white/[0.1]` — both compile, but the
codebase still has a few of the short form and consistency helps grep.

---

## Panel Reference

### Playground (`Playground.js`)
| Element                    | Line | Glass classes                                                                 |
|----------------------------|------|-------------------------------------------------------------------------------|
| Topbar                     | 277  | `bg-white/[0.14] backdrop-blur-2xl rounded-xl border-white/[0.12]` + inset 0.1  |
| Stage-list sidebar (`w-52`)| 400  | `bg-white/[0.10] backdrop-blur-xl rounded-xl border-white/[0.12]` + inset 0.08  |
| File sidebar (`w-56`)      | 458  | `bg-white/[0.10] backdrop-blur-xl rounded-xl border-white/[0.12]` + inset 0.08  |
| Tab bar                    | 539  | `bg-white/[0.12] backdrop-blur-xl border-b border-white/[0.10]`                 |
| Editor pane                | 537  | `rounded-xl border-white/[0.12] overflow-hidden` + inset 0.06 (no fill)         |
| Results panel              | 686  | `bg-white/[0.12] backdrop-blur-xl rounded-xl border-white/[0.12]` + inset 0.08  |

These six float with `gap-2` between them — that gap is what makes the glass read as separate
panes, so keep `rounded-xl` on all of them.

### Full-height / edge surfaces (**not** rounded)
Panels that touch a viewport edge use a single border instead of a radius:

| Element                     | File                        | Glass classes                                             |
|-----------------------------|-----------------------------|-----------------------------------------------------------|
| Tutorial sidebar (`w-72`)   | `Sidebar.js:207`            | `bg-white/[0.10] backdrop-blur-xl border-r border-white/[0.12]` + inset 0.08 |
| Stages topbar               | `stages/layout.js:30`       | `bg-white/[0.08] backdrop-blur-xl border-b border-white/[0.10]` |
| Home / profile nav (sticky) | `page.js:48`, `profile/page.js:326` | `bg-white/[0.10] backdrop-blur-2xl border-b border-white/[0.08]` |

---

## Text Colors

### Glass
| Role              | Class             |
|-------------------|-------------------|
| Primary text      | `text-white`      |
| Body / list items | `text-gray-200`   |
| Secondary prose   | `text-gray-300`   |
| Muted labels      | `text-gray-400`   |
| Faint / eyebrow   | `text-gray-500`   |
| Active item       | `text-white`      |
| Hover             | `hover:text-white`|

### Light / Dark
| Role              | Light              | Dark               |
|-------------------|--------------------|--------------------|
| Primary text      | `text-gray-900`    | `dark:text-white`  |
| Body              | `text-gray-700`    | `dark:text-gray-300` |
| Muted labels      | `text-gray-500`    | `dark:text-gray-400` |
| Active item       | `text-blue-700`    | `dark:text-blue-300` |

Standard hoisted pairs:
```js
const textPrimary   = isGlass ? "text-white"     : "text-gray-900 dark:text-white";
const textSecondary = isGlass ? "text-gray-300"  : "text-gray-700 dark:text-gray-300";
const textMuted     = isGlass ? "text-gray-400"  : "text-gray-500 dark:text-gray-400";
```

---

## Accent Colors

| Accent     | Where it's used                                                                 |
|------------|---------------------------------------------------------------------------------|
| **Blue**   | Primary CTA (`bg-blue-600`), section eyebrows, feature icons, progress steps, non-glass active state |
| **Purple** | Brand identity — the `Bot`/`Database` logo mark, stage badges, algorithm-step numbers, `prose-code`, lab buttons, focus rings |
| **Pink**   | Only as the far end of purple→pink gradients                                     |
| **Green**  | Passed / completed state                                                         |
| **Amber**  | "Needs attention" state in the B-tree lab; `yellow` for runtime errors and UNDER CONSTRUCTION badges |
| **Red**    | Failures and destructive actions                                                 |

Blue stays the action color in glass — purple is identity, not a button color, except inside
`BTreeVisualizer` where the lab has its own purple button set.

### Gradients
```
Hero headline text  bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent
Glass CTA / submit  bg-gradient-to-r from-purple-500 to-pink-500  + shadow-lg shadow-purple-500/25
Progress bar fill   bg-gradient-to-r from-purple-500 to-pink-500
Avatar fallback     bg-gradient-to-br from-purple-500/60 to-pink-500/60  ring-2 ring-purple-400/20
```
The non-glass counterpart of each is flat `bg-blue-600` / `from-blue-500 to-blue-600`.

---

## Spacing & Radius

| Element              | Radius   | Tailwind       |
|----------------------|----------|----------------|
| Modals, celebration cards | 16px | `rounded-2xl` |
| Glass panels, content cards | 12px | `rounded-xl` |
| Buttons, inputs, list items | 8px | `rounded-lg` |
| Segmented-control items, small badges | 6px | `rounded-md` |
| Chips, dots, avatars, step circles | full | `rounded-full` |

| Spacing           | Value    | Usage                          |
|-------------------|----------|--------------------------------|
| Panel gap         | 8px      | `gap-2` between glass panels   |
| Container padding | 12px     | `p-3` outer padding            |
| Card padding      | 20–24px  | `p-5` / `p-6`                  |
| Item padding      | 6px 12px | `px-3 py-1.5`                  |
| Content column    | —        | `max-w-4xl` docs, `max-w-6xl` marketing, both `mx-auto px-6` |

---

## Buttons & Inputs

### Primary (blue) — used in every theme
```
bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold
```

### Primary (glass gradient) — hero-level CTAs only
```
bg-gradient-to-r from-purple-500 to-pink-500 text-white
shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40
```

### Ghost / secondary (glass)
```
border-white/[0.15] bg-white/[0.08] text-white hover:bg-white/[0.12] rounded-lg font-medium
```

### Ghost / secondary (light/dark)
```
border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
```

### Language toggle
```
active   bg-blue-600 text-white
inactive bg-white/[0.05] text-gray-200 hover:bg-white/[0.1]
```

### Segmented control (auth tabs, profile tabs)
```
track   p-1 rounded-lg bg-white/[0.06]
active  bg-white/[0.12] text-white shadow-sm rounded-md
idle    text-gray-400 hover:text-gray-200
```

### Text inputs (glass)
```
px-4 py-3 rounded-lg bg-white/[0.06] border border-white/[0.12]
text-white placeholder-gray-400
focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50
```
Non-glass focus uses blue (`focus:ring-blue-500/50`). `profile/page.js` uses a slightly heavier
variant (`bg-white/[0.08] border-white/[0.15] focus:border-purple-400`).

---

## Code Editor (Monaco)

`usePlaygroundLogic.js:100` defines two custom Monaco themes via `handleEditorWillMount`;
`Playground.js:656` picks between them with `theme={isDark ? "droid-dark" : "droid-light"}`,
so **glass uses `droid-dark`**.

| Token      | `droid-light` | `droid-dark` |
|------------|---------------|--------------|
| background | `#f8f9f4`     | `#0d0d14`    |
| foreground | `#1a1e14`     | `#e8e8f0`    |
| comment    | `#8a9a80` italic | `#5a5a72` italic |
| keyword    | `#2e7d50`     | `#8b5cf6`    |
| string     | `#986820`     | `#10b981`    |
| number / constant | `#a06030` | `#f59e0b`  |
| type       | `#1a8878`     | `#06b6d4`    |
| function   | `#3d7050`     | `#818cf8`    |
| cursor / selection accent | `#3d7050` | `#6366f1` |

`droid-light` is the sage-green set; `droid-dark` is the violet/indigo set that matches the
glass backdrop. Widgets, scrollbars, and the minimap are themed too — extend both themes
together so the pair stays symmetric.

---

## File Icons

`FileIconBadge` in `usePlaygroundLogic.js:77` — colored 16×16 letter badges, resolved by
`getFileIcon(filename)`:

| Extension     | Letter | Background | Text   |
|---------------|--------|------------|--------|
| `.c`          | C      | `#005fa3`  | white  |
| `.cpp`        | C+     | `#9c33cf`  | white  |
| `.h` / `.hpp` | H      | `#6a9e3a`  | white  |
| `.rs`         | R      | `#ce422b`  | white  |
| `.toml`       | T      | `#6b7280`  | white  |
| `.zig`        | Z      | `#f7a41d`  | black  |
| `.py`         | Py     | `#3776ab`  | white  |
| `.rb`         | Rb     | `#cc342d`  | white  |
| default       | F      | `#6b7280`  | white  |

The homepage language chips reuse the same hex values (`page.js:104`) — change both together.

---

## Semantic States

### Pass / fail / error
Glass reuses the dark variants here rather than defining its own:
```
Pass:  bg-green-50  dark:bg-green-900/20  text-green-500
Fail:  bg-red-50    dark:bg-red-900/20    text-red-500
Error: bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500
```
Test-row badges step up one shade: `bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200`.

### Stage progress (sidebar + playground stage list)
| State      | Glass                                                    | Light/Dark                                   |
|------------|----------------------------------------------------------|----------------------------------------------|
| Active     | `bg-white/[0.12] text-white`                             | `bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300` |
| Passed     | `bg-green-500/[0.08] text-green-200 hover:bg-green-500/[0.14]` | `bg-green-50 dark:bg-green-900/20 text-green-700` |
| Passed badge | `bg-green-500/20 text-green-300`                       | `bg-green-100 dark:bg-green-900/30 text-green-600` |
| Idle       | `text-gray-200 hover:bg-white/[0.06] hover:text-white`   | `text-gray-700 hover:bg-gray-100`            |
| Locked     | `bg-white/[0.04] text-gray-500` + lock glyph, `opacity-60` | `bg-gray-100 dark:bg-gray-800 text-gray-400` |
| Unlocking  | `bg-green-500 text-white scale-125 ring-2 ring-green-400/50` | same                                       |

### Run phases (`progress-steps`)
Circles are shared across themes: done `bg-blue-600 border-blue-600 text-white`, current
`bg-blue-100 dark:bg-blue-900/40 border-blue-500 animate-pulse`, pending
`bg-gray-100 dark:bg-gray-700 border-gray-300 text-gray-400`.

### Completion modal
`bg-black/60 backdrop-blur-sm animate-fade-in` overlay; card is
`rounded-2xl p-8 bg-gray-900/90 border-white/[0.15] shadow-2xl` with a
`bg-green-500/20` badge around a `text-green-500` check icon.

---

## Component Notes

### `GlassShell.js`
The only place the gradient, orbs, and crosshatch exist. Takes `className` for the inner
`z-10` wrapper (e.g. `flex h-screen overflow-hidden` in `stages/layout.js`).

### `Sidebar.js` — tutorial nav
Full-height `w-72` glass column, `border-r`, no radius. Logo is `Bot` in `text-purple-400`.
Stage rows carry the progress states above; incomplete stages show a numbered circle
(`border-white/[0.15] text-gray-400`), passed ones a green `Check`.

### `StageContent.js` — tutorial page body
`max-w-4xl mx-auto px-6 py-8`. Order: breadcrumb → title/subtitle → `StageObjective` →
optional YouTube embed (`pb-[56.25%]` wrapper, `rounded-xl border-white/[0.10]`) → Core
Concepts (purple bullet dots) → `BTreeVisualizer` → Markdown body → `AlgorithmCard` list →
Implementation Checklist (`bg-white/[0.06]`, disabled checkboxes) → gradient "Launch Code
Editor" CTA → prev/next `NavLink` cards (`bg-white/[0.06] hover:bg-white/[0.10]`).

### `StageObjective.js` / `AlgorithmCard.js`
Both are `rounded-xl p-5 bg-white/[0.08] backdrop-blur-xl border-white/[0.12]` + inset 0.06.
The objective's eyebrow is `text-blue-300`; the algorithm step number is
`bg-purple-500/30 text-purple-200` in a `w-7 h-7 rounded-lg`, with `[n]` step markers in
mono `text-gray-400`.

### `MarkdownRenderer.js`
`prose max-w-none` plus, in glass: `prose-invert prose-p:text-gray-200 prose-headings:text-white
prose-strong:text-white prose-code:text-purple-300 prose-a:text-blue-300 prose-li:text-gray-200
prose-blockquote:border-white/[0.15] prose-pre:bg-gray-950 prose-pre:border-white/[0.10]`.

` ```mermaid ` fences render through `MermaidBlock` (mermaid initialized with `theme: "dark"`
in every app theme) inside a `bg-white/[0.06] border-white/[0.10]` frame with an
"Architecture Diagram" caption bar. Loading and error states are styled — keep all three.

### `BTreeVisualizer.js` — interactive labs
Only renders for `stage6-btree-leaf`, `stage7-btree-search`, `stage8-btree-split`. It carries
its own purple button set (`bg-purple-500/30 text-purple-200 border-purple-500/20` primary,
`bg-white/[0.08] text-gray-300` secondary) and an "Interactive Algorithm Lab" badge
(`text-purple-300 bg-purple-500/20`). Memory-cell semantics:

| Meaning              | Glass                                                  |
|----------------------|--------------------------------------------------------|
| Settled / correct    | `bg-green-500/10 border-green-500/20 text-green-300`   |
| Must move / pending  | `bg-amber-500/10 border-amber-500/20 text-amber-300`   |
| Vacated slot         | `bg-amber-500/15 border-amber-500/25 border-dashed animate-pulse` |
| Just inserted        | `bg-blue-500/15 border-blue-500/25 text-blue-300`      |
| Empty                | `bg-white/[0.04] border-white/[0.06] border-dashed`    |

Hex-inspector values are `text-green-300` mono.

### `AuthModal.js`
`fixed inset-0 z-[60]` with a `bg-black/40 backdrop-blur-sm` scrim. Card:
`max-w-md rounded-2xl p-8 bg-gray-900/90 backdrop-blur-2xl border-white/[0.12]` + inset 0.06.
`Database` icon in `text-purple-400`, segmented login/signup tabs, error block
`bg-red-500/15 border-red-500/20 text-red-300`, purple→pink gradient submit, and
`text-purple-300` switch links.

### `TerminalPreview.js` — homepage hero
Deliberately **not** glass: a solid `bg-gray-950` terminal chrome (`rounded-xl
border-white/[0.10] shadow-2xl`) with traffic-light dots, tabbed demo scripts
(active tab `text-blue-400 border-b-2 border-blue-400`), a green `$` prompt, a
`text-yellow-300` command line, and `text-gray-400` output. It reads as a real terminal
sitting on the glass — keep the opaque background.

### Home page (`app/(main)/page.js`)
Sticky glass nav → hero (blue pill badge with `animate-pulse` dot, gradient headline,
blue CTA + ghost GitHub link, language chips, `TerminalPreview`) → How It Works
(`bg-white/[0.08]` cards, blue icons) → What You Will Implement (`bg-white/[0.06]` cards,
purple icons) → Roadmap (`roadmap-card`, `hover:bg-white/[0.10]`, green READY vs
`bg-yellow-500/15 text-yellow-400` UNDER CONSTRUCTION badges) → signup CTA → footer.
Section eyebrows are `text-[10px] font-bold tracking-widest uppercase text-blue-400`.

### Profile page (`app/(main)/profile/page.js`)
`cardCls = bg-white/[0.06] backdrop-blur-xl border-white/[0.10] rounded-xl`. Avatar falls back
to a purple→pink gradient circle with a hover `bg-black/50` camera overlay. Progress bar:
`h-2 rounded-full` track `bg-white/[0.08]`, fill `bg-gradient-to-r from-purple-500 to-pink-500`.
Three tabs (Progress / Submissions / Account) use the segmented control. Stat numerals are
`text-purple-300` for "Passed", `text-white` otherwise.

---

## Data Attributes (for e2e tests)

All interactive elements use `data-testid` instead of CSS class selectors. Active states use
`data-active="true"`; test results use `data-status="pass"/"fail"`.

Playground: `pg-topbar`, `pg-topbar-stage`, `pg-sidebar`, `pg-file-item`, `pg-new-file-btn`,
`pg-new-file-input`, `pg-tab`, `pg-tab-close`, `pg-editor-pane`, `pg-lang-btn`, `pg-save-btn`,
`pg-reset-btn`, `pg-submit-btn`, `pg-results-panel`, `pg-results-banner`,
`pg-results-banner-title`, `pg-test-item`, `pg-test-detail`, `pg-error-banner`,
`pg-stage-locked`, `pg-completion-modal`, `pg-user-name`, `progress-steps`.

Auth: `auth-overlay`, `auth-modal`, `auth-title`, `auth-tab-login`, `auth-tab-signup`,
`auth-error`, `auth-submit`, `auth-close`. Marketing: `hero-tagline`, `roadmap-card`,
`chip-c` / `chip-cpp` / `chip-rust` / `chip-zig`.

Renaming a testid breaks `e2e/` — update both in the same commit.

---

## Applying Glass to New Pages

1. Wrap the page in `<GlassShell>` — never re-create the gradient, orbs, or crosshatch.
2. Read `isGlass` from `useTheme()` and hoist the class constants you'll reuse
   (`textPrimary`, `textMuted`, `cardCls`, …).
3. Every glass branch needs a light/dark counterpart in the same expression — no glass-only
   surfaces.
4. Panels: `bg-white/[0.10]`–`[0.14]` + `backdrop-blur-xl` + `border border-white/[0.12]` +
   `rounded-xl` + an inset highlight. Content cards drop to `[0.06]`–`[0.08]`; hover is
   `[0.06]`, or one tier up from the resting state.
5. Edge-anchored surfaces (full-height columns, sticky headers) use `border-r`/`border-b`
   and **no** radius.
6. Text: white / gray-200 / gray-300 for anything readable; gray-400 and below for labels and
   eyebrows only.
7. Blue for actions, purple for identity, gradients only on hero-level CTAs.
8. Add `data-testid` to anything an e2e test will need to click or assert on.
