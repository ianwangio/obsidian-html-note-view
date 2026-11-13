export function parseCsvList(csv: string): string[] {
  return csv
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Normalizes a frontmatter HTML property value into a clean file link/path.
 * Supports:
 *  - Quoted Obsidian Wikilinks: "[[attachments/demo.html]]" or "[[demo.html|Demo]]"
 *  - Unquoted YAML nested arrays: [[attachments/demo.html]]
 *  - Markdown links: "[Demo](attachments/demo%20page.html)"
 *  - Plain relative or vault-root paths: "attachments/demo.html"
 */
export function normalizeHtmlTarget(raw: unknown): string | null {
  let val: unknown = raw;
  while (Array.isArray(val) && val.length > 0) {
    val = val[0];
  }
  if (typeof val !== 'string') return null;

  let s = val.trim().replace(/^["']|["']$/g, '').trim();
  if (!s) return null;

  if (s.startsWith('[[') && s.endsWith(']]')) {
    s = s.slice(2, -2).split('|')[0].split('#')[0].trim();
  } else {
    const mdMatch = /^\[[^\]]*\]\(([^)]+)\)$/.exec(s);
    if (mdMatch && mdMatch[1]) {
      const href = mdMatch[1].trim();
      try {
        s = decodeURIComponent(href);
      } catch {
        s = href;
      }
    }
  }

  return s || null;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fast fallback extraction directly from the YAML frontmatter block before metadataCache finishes indexing.
 */
export function extractHtmlFromRawFrontmatter(markdownHead: string, keys: string[]): string | null {
  if (!keys.length) return null;
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdownHead);
  if (!fmMatch || !fmMatch[1]) return null;

  const pattern = keys.map(escapeRegExp).join('|');
  const keyRe = new RegExp(`^(?:${pattern})\\s*:\\s*([^\\r\\n]+?)\\s*$`, 'm');
  const hit = keyRe.exec(fmMatch[1]);
  if (!hit || !hit[1]) return null;
  return normalizeHtmlTarget(hit[1]);
}
