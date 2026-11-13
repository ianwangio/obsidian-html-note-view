---
title: Interactive System Architecture Demo
summary: Demonstrates how a thin .md host + full-tab interactive HTML attachment preserves Obsidian Bases tags, wikilinks, and full-text search
status: evergreen
tags: [agent-arch, pkm]
html: "[[attachments/interactive-architecture-demo.html]]"
created: 2026-11-13
updated: 2026-11-13
---

# Interactive System Architecture Demo (Searchable Summary Layer)

> You are viewing the underlying Markdown layer (used for YAML properties, backlinks, and `Cmd/Ctrl + Shift + F` full-text search). Click the **🌐 globe icon** in the top-right tab header—or click the `html` link in Properties above—to return to **Full HTML View**.

## Key Searchable Takeaways

- **Architecture**: Standard `.md` note stores YAML frontmatter (`status`, `tags`, `summary`, `html`) + searchable text summary, while `HTML Note View` renders the linked `.html` attachment edge-to-edge across the entire tab.
- **Why not raw `.html` files**: Obsidian's core `Bases` (`.base`) plugin restricts note property columns to `extension === "md"`.
- **Runtime Bridge**: Syncs Obsidian dark/light mode (`<html data-theme="dark|light">`), injects a collapsible corner badge, and enables smooth `#anchor` TOC scrolling + external browser links.
