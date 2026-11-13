import { App, Notice, TFile } from 'obsidian';
import { extractNormalizedTags } from './bridge';
import { t } from './i18n';
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

    const i18n = t(settings.language);
    const errors: string[] = [];
    const allowedStatuses = new Set(parseCsvList(settings.validStatuses));
    const forbiddenTags = new Set(parseCsvList(settings.forbiddenTags));

    if (typeof fm.status === 'string' && fm.status.trim() && allowedStatuses.size > 0) {
      const st = fm.status.trim();
      if (!allowedStatuses.has(st)) {
        errors.push(i18n.lintInvalidStatus(st));
      }
    }

    const tags = extractNormalizedTags(fm);
    if (settings.maxTags > 0 && tags.length > settings.maxTags) {
      errors.push(i18n.lintTooManyTags(tags.length, settings.maxTags));
    }

    for (const tag of tags) {
      if (forbiddenTags.has(tag)) {
        errors.push(i18n.lintForbiddenTag(tag));
        continue;
      }
      if (settings.enforceKebabCaseTags && !KEBAB_TAG_RE.test(tag)) {
        errors.push(i18n.lintInvalidTagFormat(tag));
        continue;
      }
      if (this.canonicalTags.size > 0 && !this.canonicalTags.has(tag)) {
        errors.push(i18n.lintNotInCanonical(tag, settings.canonicalTagSpecPath));
      }
    }

    const sig = `${settings.language}:${errors.join('|')}`;
    if (errors.length > 0) {
      if (this.lastAlertSignature.get(file.path) !== sig) {
        this.lastAlertSignature.set(file.path, sig);
        new Notice(`${i18n.lintNoticeHeader(file.name)}\n• ${errors.join('\n• ')}`, 7000);
      }
    } else {
      this.lastAlertSignature.delete(file.path);
    }

    return errors;
  }
}
