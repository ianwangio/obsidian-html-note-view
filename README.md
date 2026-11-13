# Obsidian HTML Note View

**English** | [简体中文](./README.zh-CN.md)

Render AI-generated interactive HTML pages (system architecture maps, filterable matrices, interactive simulators, rich manuals) as **100% edge-to-edge full-tab views** in Obsidian—just like Excalidraw or Kanban—while **100% natively preserving** Markdown YAML Frontmatter, Obsidian **Bases (`.base`)** database tag columns, backlinks, Graph View, global full-text search (`Cmd/Ctrl + Shift + F`), and automatic on-save tag linting.

---

## Why HTML Note View?

AI Coding Agents (Claude Code, Codex, Cursor, Antigravity) excel at generating self-contained interactive HTML + CSS + SVG + JS explainers where plain Markdown falls short. However, dropping raw `.html` files directly into an Obsidian vault breaks core PKM workflows:

1. **Obsidian `Bases` (`.base`) ignores non-Markdown properties**: Obsidian's core `Bases` plugin enforces a strict `extension === "md"` check—raw `.html` files cannot display `tags`, `status`, or `summary` columns in `.base` tables.
2. **Inline Markdown `<iframe>` embeds feel cramped**: Constrained by readable line width (`~880px`), inline titles, and property headers, embedded iframes turn into narrow boxes with nested scrollbars.
3. **Broken `#anchor` TOC links in Electron `srcdoc`**: Native `<a href="#section">` table-of-contents links fail to scroll inside `about:srcdoc` iframes, and external links risk hijacking the active pane.

**HTML Note View solves all three using the Excalidraw / Kanban "Thin `.md` Host + `.html` Attachment" pattern**:
- **On Disk**: Your note stays a real `.md` file holding YAML frontmatter (`status`, `tags`, `summary`, clickable `html: "[[attachments/xxx.html]]"` wikilink) plus a concise searchable text summary, while the interactive HTML lives cleanly in `attachments/`.
- **In Workspace**: Opening that `.md` note automatically upgrades the tab into a **zero-padding 100% full-tab HTML view** with a collapsible floating `status + #tags` badge. Click `</>` in the tab header anytime to flip back to Markdown view and edit properties.

---

## Key Features

- **100% Edge-to-Edge Full-Tab Takeover & 1-Click Toggle**: Zero padding, zero double scrollbars. Flip effortlessly between Full HTML View (`</>` icon) and Markdown View (`🌐` icon) from the tab header, context menu, or Command Palette.
- **Native Clickable Wikilink Property (`html: "[[attachments/xxx.html]]"`)**: Renders as a real clickable Obsidian link inside both the **Properties** panel and **`.base` database tables**. Moving or renaming the `.html` file automatically updates the frontmatter link without breaking; clicking the link jumps straight into Full HTML View (`Cmd/Ctrl + Click` opens in a new tab).
- **Floating Collapsible Metadata Badge**: Reads `status`, `#tags`, and `updated` date from the host `.md` frontmatter and renders a sleek glassmorphism pill in the top-right (or bottom-right) corner, live-reloading whenever you edit properties in `.base` or Markdown.
- **Automatic Dark / Light Theme Sync**: Synchronizes Obsidian's active dark/light mode onto `<html data-theme="dark|light">` in real time.
- **Built-in `srcdoc` Navigation Bridge**:
  - Smoothly scrolls `<a href="#section-id">` TOC/anchor links inside the page (respecting `scroll-margin-top`) and syncs `.active` TOC states;
  - Opens external `http(s)://` / `mailto:` links cleanly in your default system browser;
  - Routes relative vault links through Obsidian's native `openLinkText` router.
- **On-Save Tag & Status Linter**: Automatically validates `kebab-case` tag formatting, per-note tag count limits, allowed `status` values, and optional canonical tag dictionary notes in your vault.
- **Bilingual UI (`English` / `简体中文`)**: Automatically follows your Obsidian interface language or lets you choose explicitly in Settings.

---

## Quick Start

### 1. Installation

#### Option A: Via BRAT (Recommended)
1. Install the **BRAT** community plugin in Obsidian.
2. Run **BRAT: Add a beta plugin for testing** and enter:
   `ianwangio/obsidian-html-note-view`
3. Enable **HTML Note View** under `Settings → Community plugins`.

#### Option B: Manual Release Download
Download `main.js`, `manifest.json`, and `styles.css` from [GitHub Releases](https://github.com/ianwangio/obsidian-html-note-view/releases), place them into `<your-vault>/.obsidian/plugins/html-note-view/`, and enable **HTML Note View** in `Settings → Community plugins`.

#### Option C: Build from Source
```bash
cd /path/to/your-vault/.obsidian/plugins/html-note-view
npm install
npm run build
```

> 💡 **Reload Tip**: On macOS, Obsidian does not bind `Cmd + R` by default. To reload after updating files, toggle **HTML Note View** off/on in `Settings → Community plugins`, or press `Cmd/Ctrl + P` and run `Reload app without saving`.

### 2. Create Your First Full-Tab HTML Note

Folder layout:

```text
notes/
├── Centrifugo Architecture Guide.md
└── attachments/
    └── centrifugo-guide.html
```

Host note `notes/Centrifugo Architecture Guide.md`:

```markdown
---
title: Centrifugo Architecture Guide
summary: Standalone Go real-time messaging server (v6) decoupling stateful connections from stateless backends
status: exploring
tags: [messaging, agent-arch]
html: "[[attachments/centrifugo-guide.html]]"
created: 2026-11-13
updated: 2026-11-13
---

# Centrifugo Architecture Guide (Searchable Summary Layer)

- **Core Role**: Language-agnostic real-time messaging gateway supporting WebSocket, HTTP-Streaming, SSE, and WebTransport.
- **Stream Recovery**: Sliding-window `(offset, epoch)` cache recovers missed publications after brief disconnects.
- **Backend Integration**: HTTP/gRPC Server API, reverse Connect/RPC proxies, and native PostgreSQL Outbox / Kafka consumers.
```

---

## 🤖 Copy-Paste Prompt for `AGENTS.md` / `CLAUDE.md`

Paste the following ruleset into your vault's root **`AGENTS.md`** (or `CLAUDE.md`) so AI agents (Claude Code, Codex, Cursor, Antigravity) consistently author HTML notes that work seamlessly with `.base` views, full-text search, theme switching, and the built-in tag linter:

````markdown
## Interactive HTML Note Convention (for HTML Note View Plugin)

When producing high-density interactive dashboards, filterable reference manuals, or SVG architecture simulators where plain Markdown is limiting, **NEVER drop standalone `.html` files at the note root** (Obsidian `.base` database views ignore properties/tags on non-`.md` files). Always use the **"Thin `.md` Host + `attachments/*.html`"** dual-file pattern:

### 1. File Layout
- **Host Note**: `<target-folder>/<Readable Title>.md` (holds YAML metadata, wikilinks, and searchable text summary)
- **HTML Attachment**: `<same-folder>/attachments/<short-name>.html` (single self-contained HTML file)

### 2. Host `.md` Frontmatter Schema
```yaml
---
title: Human-Readable Title
summary: One-sentence core takeaway displayed in indexes and .base tables
status: exploring
tags: [messaging, distributed-systems]
html: "[[attachments/file-name.html]]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: ["[[Related Note]]"]
---
```
- **`html` MUST be a quoted Obsidian Wikilink**: Always write `html: "[[attachments/xxx.html]]"` (or `"[[xxx.html]]"` if unique), **never** an unquoted plain path. This makes the property clickable in Obsidian Properties & `.base` tables and automatically rename-safe.
- **`status` lifecycle**: Use only valid vault status values (e.g., `seeding`, `exploring`, `converging`, `crystallized`, `dormant`, `archived`, `evergreen`, or product states `draft`, `final`, `implemented`, `superseded`).

### 3. Hard Rules for `tags` (Enforced by On-Save Linter)
1. **Lowercase `kebab-case` only**:
   - Tags may contain only lowercase ASCII letters `a-z`, digits `0-9`, and hyphens `-` (e.g., `prompt-caching`, `agent-arch`, `real-time`).
   - **NEVER** use uppercase letters, spaces, underscores `_`, or non-ASCII characters in `tags`.
2. **Hierarchy separator (`/` only, NEVER `:`)**:
   - When nesting is genuinely needed, use Obsidian's native slash `/` up to **2 levels max** (e.g., `energy/nuclear`).
   - **NEVER use colons `:`** (`:` is invalid in Obsidian tags and breaks tag parsing).
3. **Tag budget**: Keep **2–4 tags** per note. Less is more.
4. **Concepts get `tags`; Specific Entities get `[[wikilinks]]`**:
   - Ask: *"Will this label apply to 3+ unrelated notes in the future?"*
   - Yes (reusable domains, paradigms, mechanisms like `messaging`, `auth`, `eval`) → put in `tags`.
   - No (specific tools, repositories, companies, products, or people like `Centrifugo`, `Kafka`, `Cloudflare`) → **do NOT create a tag**; link via `[[wikilink]]` in body or `related`.
5. **Do not duplicate `status` in `tags`**: Lifecycle maturity belongs strictly in `status`, never in `tags` (no `#draft` or `#evergreen` tags).
6. **Check Canonical Tag Dictionary** (if the vault maintains one, e.g., `metaspace/spec/tags.md`): Reuse existing canonical tags before proposing any new tag.

### 4. Searchable Summary Layer in Host `.md` Body
Obsidian's global search (`Cmd/Ctrl + Shift + F`) indexes `.md` text. After generating the `.html` attachment, **always** write a concise 10–30 line structured summary in the host `.md` body covering key conclusions, architecture components, domain terms, and config/API identifiers so full-text search hits reliably.

### 5. HTML Attachment Authoring Rules
1. **Dual-Theme Support (`dark` & `light`)**:
   - Declare `<html lang="en" data-theme="dark">` (or `lang="zh-CN"`).
   - Define semantic CSS custom properties under both `:root` (dark) and `[data-theme="light"]` (light); prefer `currentColor` in inline SVGs. The plugin automatically syncs `data-theme` with Obsidian.
2. **Reserve Top-Right Badge Area**:
   - The plugin injects a floating `status + #tags + date` pill at `top: 64px; right: 22px` by default. Do **not** hardcode duplicate tag badges inside the HTML, and avoid placing critical controls under that region.
3. **TOC Anchors & Links**:
   - Give sections semantic `<section id="...">` attributes with `scroll-margin-top: 84px` to clear sticky headers.
   - Use standard `<a href="#section-id">` for in-page TOC navigation and `<a href="https://...">` for external references—the plugin's runtime bridge automatically handles smooth container scrolling and system browser opening.
4. **Single-File Offline Self-Containment**: Inline all CSS, SVG, and interactive JS within the single `.html` file with zero external build steps or fragile CDN dependencies.
````

---

## Plugin Settings

Configure everything under `Settings → HTML Note View`:

| Setting | Default | Description |
|---|---|---|
| **Interface language** | `Auto (Follow Obsidian)` | Switch between `Auto`, `English`, and `简体中文` |
| **Frontmatter HTML property keys** | `html, html-file` | Comma-separated frontmatter keys that point to an HTML attachment |
| **Automatically open in Full HTML view** | `On` | Automatically open matching `.md` notes in full-tab HTML mode |
| **Sync Obsidian dark/light theme** | `On` | Sync `<html data-theme="dark\|light">` with Obsidian's active theme |
| **Show floating metadata badge** | `On` | Inject collapsible `status + #tags + date` pill from `.md` frontmatter |
| **Badge position / Top offset** | `Top right` / `64px` | Choose top-right or bottom-right and adjust vertical offset |
| **Enable frontmatter tag & status lint** | `On` | Validate `tags` and `status` whenever note properties are saved |
| **Enforce lowercase kebab-case tags** | `On` | Warn on uppercase, spaces, non-ASCII, or invalid `:` characters |
| **Maximum tags per note** | `4` | Warn when tag count exceeds budget (`0` = unlimited) |
| **Allowed status values** | PKM & Product states | Comma-separated allowed `status` values (leave empty to allow any) |
| **Canonical tag dictionary path** | *(empty)* | Optional vault Markdown path with `` `tag` `` table rows as whitelist |

---

## Development

```bash
npm install
npm run dev     # Watch mode
npm run build   # TypeScript typecheck + minified production bundle
```

## License

[MIT](./LICENSE)
