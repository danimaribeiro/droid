# Droid — Glass Theme Style Guide

Design direction: frosted dark-glass panels floating over a deep purple gradient with colored light orbs and subtle diagonal crosshatch lines.

---

## Typography

| Role       | Family           | Weights    | Usage                    |
|------------|------------------|------------|--------------------------|
| UI / Body  | Inter            | 300–900    | All UI text              |
| Code       | JetBrains Mono   | 400–600    | Editor, code blocks      |

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap">
```

---

## CSS Stack

- **Tailwind CSS v3** — utility-first styling
- **Preline UI** — component plugin for dropdowns, modals, etc.
- No globals.css — all styling via Tailwind utilities and inline styles

---

## Background — Purple Gradient + Light Orbs

The glass theme background uses a deep purple gradient with colored radial light spots.
The spots give the frosted panels something to blur through.

```jsx
style={{ background: "linear-gradient(135deg, #3d1f5c 0%, #2a1445 25%, #1a0e30 50%, #1a1030 75%, #2d1248 100%)" }}
```

### Colored light orbs (positioned as absolute divs)
```
Top-left:     rgba(230,100,140, 0.25) — pink/coral
Top-right:    rgba(240,170,110, 0.18) — warm peach
Bottom-right: rgba(140,80,220,  0.20) — purple
```

### Diagonal crosshatch lines (texture overlay)
```css
repeating-linear-gradient(135deg, transparent, transparent 48px, rgba(255,255,255,0.07) 48px, rgba(255,255,255,0.07) 49px),
repeating-linear-gradient(45deg,  transparent, transparent 48px, rgba(255,255,255,0.05) 48px, rgba(255,255,255,0.05) 49px)
```

---

## Glass Panel Effect

All floating panels share the same frosted glass treatment using Tailwind utilities.

### Panel classes by element
| Element          | bg-white opacity | Backdrop      | Border            | Extra                                        |
|------------------|------------------|---------------|-------------------|----------------------------------------------|
| Topbar           | `bg-white/[0.14]`| `backdrop-blur-2xl` | `border-white/[0.12]` | `shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]` |
| Tutorial sidebar | `bg-white/[0.10]`| `backdrop-blur-xl`  | `border-white/[0.12]` | `shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]` |
| File sidebar     | `bg-white/[0.10]`| `backdrop-blur-xl`  | `border-white/[0.12]` | `shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]` |
| Tab bar          | `bg-white/[0.12]`| `backdrop-blur-xl`  | `border-white/[0.10]` | —                                            |
| Editor pane      | —                | —                   | `border-white/[0.12]` | `shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]` |
| Results panel    | `bg-white/[0.12]`| `backdrop-blur-xl`  | `border-white/[0.12]` | `shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]` |

All panels use `rounded-xl` (12px).

### Inner borders (dividers within panels)
```
border-white/[0.08] — separators
border-white/[0.10] — shared border variable
```

---

## Text Colors (Glass Theme)

High contrast — white for primary, gray-200 for secondary.

| Role              | Color          | Tailwind class   |
|-------------------|----------------|------------------|
| Primary text      | white          | `text-white`     |
| Secondary text    | gray-200       | `text-gray-200`  |
| Muted labels      | gray-300–400   | `text-gray-300`  |
| Section headers   | gray-400       | `text-gray-400`  |
| Separators        | gray-500       | `text-gray-500`  |
| Active item       | white or blue-300 | `text-white` or `text-blue-300` |
| Hover             | white          | `hover:text-white` |

---

## Text Colors (Light / Dark Themes)

| Role              | Light              | Dark               |
|-------------------|--------------------|--------------------|
| Primary text      | `text-gray-800`    | `text-gray-200`    |
| Secondary text    | `text-gray-600`    | `text-gray-400`    |
| Muted labels      | `text-gray-400`    | `text-gray-500`    |
| Active item       | `text-blue-700`    | `text-blue-300`    |

---

## Spacing & Radius

| Element          | Border-radius  | Tailwind       |
|------------------|----------------|----------------|
| Glass panels     | 12px           | `rounded-xl`   |
| Buttons          | 8px            | `rounded-lg`   |
| Badges           | 4–6px          | `rounded` / `rounded-md` |
| Full badges      | 9999px         | `rounded-full` |

| Spacing          | Value   | Usage                    |
|------------------|---------|--------------------------|
| Panel gap        | 8px     | `gap-2` between panels   |
| Container padding| 12px    | `p-3` outer padding      |
| Item padding     | 6px 12px| `px-3 py-1.5`            |

---

## Buttons

### Primary (blue)
```
bg-blue-600 text-white hover:bg-blue-700
rounded-lg font-semibold
```

### Ghost / secondary (glass)
```
border-white/[0.15] bg-white/[0.08] text-white hover:bg-white/[0.12]
rounded-lg font-medium
```

### Ghost / secondary (light/dark)
```
border-gray-200 dark:border-gray-700
bg-white dark:bg-gray-800
text-gray-700 dark:text-gray-300
hover:bg-gray-50 dark:hover:bg-gray-700
```

### Language toggle (active)
```
bg-blue-600 text-white
```

### Language toggle (inactive, glass)
```
bg-white/[0.05] text-gray-200 hover:bg-white/[0.1]
```

---

## File Icons

JSX `FileIconBadge` component — colored 16x16 letter badges:

| Extension     | Letter | Background | Text   |
|---------------|--------|------------|--------|
| `.c`          | C      | `#005fa3`  | white  |
| `.cpp`        | C+     | `#9c33cf`  | white  |
| `.h` / `.hpp` | H      | `#6a9e3a`  | white  |
| `.rs`         | R      | `#ce422b`  | white  |
| `.toml`       | T      | `#6b7280`  | white  |
| `.zig`        | Z      | `#f7a41d`  | black  |
| default       | F      | `#6b7280`  | white  |

---

## Semantic Components

### Pass/Fail (shared across themes)
```
Pass:  bg-green-50 dark:bg-green-900/20 text-green-500
Fail:  bg-red-50   dark:bg-red-900/20   text-red-500
Error: bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500
```

---

## Data Attributes (for e2e tests)

All interactive elements use `data-testid` attributes instead of CSS class selectors.
Active states use `data-active="true"`. Test result status uses `data-status="pass"/"fail"`.

See `Playground.js` for the full list of `data-testid` values.

---

## Applying Glass to New Pages

When migrating pages to the glass theme:

1. Wrap in `dark` class container with the purple gradient background
2. Add the 3 colored light orb divs (absolute positioned)
3. Add the diagonal crosshatch overlay div
4. Use `bg-white/[0.10-0.14]` + `backdrop-blur-xl` + `border border-white/[0.12]` + `rounded-xl` on panels
5. Add `shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]` for inner glow
6. Use white/gray-200 for text, never gray-400+ for readable content
7. Buttons: `border-white/[0.15] bg-white/[0.08]` for ghost style
