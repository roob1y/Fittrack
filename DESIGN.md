# Health Ecosystem — Design System

A shared design language across all four apps. Every app uses the same
dark background, typography and component patterns — only the accent
colour changes per app.

---

## Colours

### App Accent Colours

| App | Colour | Hex |
|---|---|---|
| FitTrack | Lime green | `#c8f135` |
| NutriTrack | Warm orange | `#ff8c42` |
| BodyTrack | Electric blue | `#4fc3f7` |
| MindTrack | Soft purple | `#b388ff` |

### Shared Base Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0d0d0f` | Page background |
| `--surface` | `#16161a` | Input backgrounds, secondary surfaces |
| `--card` | `#1e1e24` | Cards, panels |
| `--border` | `#2a2a35` | Borders, dividers |
| `--text` | `#f0f0f5` | Primary text |
| `--muted` | `#7a7a8c` | Secondary text, labels, placeholders |
| `--red` | `#ff4d6d` | Errors, warnings, over-limit states |
| `--accent2` | `#5b8dee` | Secondary accent (used in FitTrack meals) |

---

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Logo / App name | Bebas Neue | 400 | 28px |
| Section titles | Bebas Neue | 400 | 22px |
| Day / screen titles | Bebas Neue | 400 | 36px |
| Stat values | Bebas Neue | 400 | 34px |
| Body text | DM Sans | 400 | 14–15px |
| Labels / meta | DM Sans | 500–600 | 12–13px |

### Google Fonts import

```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
```

---

## CSS Variables (per app)

Each app defines its own `--accent` at the `:root` level. All other
tokens are identical across apps.

```css
/* FitTrack */
:root { --accent: #c8f135; }

/* NutriTrack */
:root { --accent: #ff8c42; }

/* BodyTrack */
:root { --accent: #4fc3f7; }

/* MindTrack */
:root { --accent: #b388ff; }
```

### Shared Base CSS

```css
:root {
  --bg: #0d0d0f;
  --surface: #16161a;
  --card: #1e1e24;
  --border: #2a2a35;
  --accent2: #5b8dee;
  --red: #ff4d6d;
  --text: #f0f0f5;
  --muted: #7a7a8c;
  --radius: 14px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
}
```

---

## Components

### Header
- Sticky, blurred background: `rgba(13,13,15,0.92)` with `backdrop-filter: blur(12px)`
- Logo in Bebas Neue at accent colour
- Border bottom: `1px solid var(--border)`

### Navigation
- Three tabs: primary views for the app
- Active tab: accent background, dark text
- Inactive tab: card background, muted text

### Cards
- Background: `var(--card)`
- Border: `1px solid var(--border)`
- Border radius: `var(--radius)` (14px)
- Active/selected state: border switches to `var(--accent)`

### Buttons — Primary
- Background: `var(--accent)`
- Text: `#0d0d0f` (dark, not white)
- Font: Bebas Neue, 20px, letter-spacing 1.5px
- Border radius: `var(--radius)`

### Buttons — Secondary
- Background: `var(--surface)`
- Border: `1px solid var(--border)`
- Text: `var(--text)`
- Font: DM Sans, 13px, weight 600

### Inputs
- Background: `var(--surface)`
- Border: `1px solid var(--border)`
- Focus border: `var(--accent)`
- Border radius: 8px
- Font: DM Sans, 14px

### Toast notifications
- Background: `var(--accent)`
- Text: `#0d0d0f`
- Font: DM Sans, 14px, weight 700
- Fixed bottom centre, slides up on show

---

## Layout

- Mobile first — designed for Android
- Max content width: unconstrained on mobile, consider `max-width: 480px` centred on desktop
- Page padding: 20px horizontal
- Card gaps: 12–14px
- Section title margin bottom: 14px

---

## Design Principles

- **Dark by default** — no light mode planned for v1
- **Accent does the talking** — each app feels distinct through its accent colour alone
- **Bebas Neue for impact** — used only for titles, stats and CTAs, never body text
- **No gradients** — flat, clean surfaces only
- **Minimum chrome** — no unnecessary decoration, every element earns its place
