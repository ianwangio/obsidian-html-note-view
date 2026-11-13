import { App, Notice, TFile } from 'obsidian';
import { extractNormalizedTags } from './bridge';
import { parseCsvList } from './parser';
import { HtmlNoteViewSettings } from './types';

const KEBAB_TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const CANONICAL_TABLE_ROW_RE = /^\|\s*`([a-z0-9/-]+)`\s*\|/;

export class NoteMetadataLinter {
  private app: App;
  private canonicalTags: Set<string> = new Set();
  private lastAlertSignature: Map<string, string> = new Map();

  constructor(app: App) {
    this.app = app;
  }

  async reloadCanonicalTags(settings: HtmlNoteViewSettings): Promise<void> {
    this.canonicalTags.clear();
    const specPath = settings.canonicalTagSpecPath.trim();
    if (!specPath) return;

    const specFile = this.app.vault.getAbstractFileByPath(specPath);
    if (!(specFile instanceof TFile)) return;

    try {
      const content = await this.app.vault.cachedRead(specFile);
      const forbidden = new Set(parseCsvList(settings.forbiddenTags));
      for (const rawLine of content.split(/\r?\n/)) {
        const match = CANONICAL_TABLE_ROW_RE.exec(rawLine.trim());
        if (match && match[1] && !forbidden.has(match[1])) {
          this.canonicalTags.add(match[1]);
        }
      }
    } catch {
      // Ignore read errors on optional canonical tag dictionary
    }
  }

  lintNote(file: TFile, settings: HtmlNoteViewSettings): string[] {
    if (!settings.enableLint) return [];

    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (!fm) return [];

    const errors: string[] = [];
    const allowedStatuses = new Set(parseCsvList(settings.validStatuses));
    const forbiddenTags = new Set(parseCsvList(settings.forbiddenTags));

    if (typeof fm.status === 'string' && fm.status.trim() && allowedStatuses.size > 0) {
      const st = fm.status.trim();
      if (!allowedStatuses.has(st)) {
        errors.push(`非法 status "${st}"（不在允许的状态集合内）`);
      }
    }

    const tags = extractNormalizedTags(fm);
    if (settings.maxTags > 0 && tags.length > settings.maxTags) {
      errors.push(`tags 数量 (${tags.length}) 超过上限 (${settings.maxTags})`);
    }

    for (const tag of tags) {
      if (forbiddenTags.has(tag)) {
        errors.push(`标签 "${tag}" 被设为默认禁标项，请移除`);
        continue;
      }
      if (settings.enforceKebabCaseTags && !KEBAB_TAG_RE.test(tag)) {
        errors.push(
          `标签 "${tag}" 格式不合法（须为英文小写 kebab-case，至多两级 "/" 分隔，严禁用 ":" 或中文）`
        );
        continue;
      }
      if (this.canonicalTags.size > 0 && !this.canonicalTags.has(tag)) {
        errors.push(`标签 "${tag}" 不在受控标签词表 (${settings.canonicalTagSpecPath}) 内`);
      }
    }

    const sig = errors.join('|');
    if (errors.length > 0) {
      if (this.lastAlertSignature.get(file.path) !== sig) {
        this.lastAlertSignature.set(file.path, sig);
        new Notice(`⚠️ Metadata Lint (${file.name}):\n• ${errors.join('\n• ')}`, 7000);
      }
    } else {
      this.lastAlertSignature.delete(file.path);
    }

    return errors;
  }
}
