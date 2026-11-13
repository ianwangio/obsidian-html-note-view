export const HTML_NOTE_VIEW_TYPE = 'html-note-view';

export type BadgePosition = 'top-right' | 'bottom-right';
export type LanguageSetting = 'auto' | 'en' | 'zh';

export interface HtmlNoteViewSettings {
  /** UI language preference: follow Obsidian locale or force en/zh */
  language: LanguageSetting;
  /** Comma-separated frontmatter keys pointing to an HTML file, e.g. "html, html-file" */
  propertyKeys: string;
  /** Automatically open notes with an HTML property in Full HTML View */
  autoOpenHtmlView: boolean;
  /** Sync Obsidian's dark/light theme onto <html data-theme="dark|light"> */
  syncTheme: boolean;
  /** Inject floating status + tags pill into rendered HTML */
  showCornerBadge: boolean;
  /** Corner position for the floating metadata pill */
  badgePosition: BadgePosition;
  /** Vertical offset in pixels (avoids overlapping sticky headers in HTML pages) */
  badgeOffsetPx: number;
  /** Lint frontmatter status & tags on save */
  enableLint: boolean;
  /** Enforce lowercase kebab-case tags (with optional single "/" hierarchy) */
  enforceKebabCaseTags: boolean;
  /** Maximum number of tags allowed per note (0 = unlimited) */
  maxTags: number;
  /** Comma-separated list of allowed status values (empty = allow any) */
  validStatuses: string;
  /** Comma-separated list of forbidden tags (e.g. default states that shouldn't be tagged) */
  forbiddenTags: string;
  /** Optional vault-relative path to a markdown note containing canonical tag tables */
  canonicalTagSpecPath: string;
}

export const DEFAULT_SETTINGS: HtmlNoteViewSettings = {
  language: 'auto',
  propertyKeys: 'html, html-file',
  autoOpenHtmlView: true,
  syncTheme: true,
  showCornerBadge: true,
  badgePosition: 'top-right',
  badgeOffsetPx: 64,
  enableLint: true,
  enforceKebabCaseTags: true,
  maxTags: 4,
  validStatuses:
    'seeding, exploring, converging, crystallized, dormant, archived, evergreen, draft, final, implemented, superseded',
  forbiddenTags: '',
  canonicalTagSpecPath: '',
};

export const STATUS_DISPLAY_MAP: Record<string, string> = {
  seeding: '🌱 seeding',
  exploring: '🔥 exploring',
  converging: '🔄 converging',
  crystallized: '💎 crystallized',
  dormant: '😴 dormant',
  archived: '📦 archived',
  evergreen: '🌲 evergreen',
  draft: '📝 draft',
  final: '✅ final',
  implemented: '🚀 implemented',
  superseded: '⏭️ superseded',
};
