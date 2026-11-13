import { Command, FileView, Plugin, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import { t } from './i18n';
import { NoteMetadataLinter } from './linter';
import { extractHtmlFromRawFrontmatter, normalizeHtmlTarget, parseCsvList } from './parser';
import { HtmlNoteViewSettingTab } from './settings';
import { DEFAULT_SETTINGS, HTML_NOTE_VIEW_TYPE, HtmlNoteViewSettings } from './types';
import { FullHtmlLeafView } from './view';

export default class HtmlNoteViewPlugin extends Plugin {
  settings: HtmlNoteViewSettings = { ...DEFAULT_SETTINGS };
  linter!: NoteMetadataLinter;
  private toggleCommand: Command | null = null;
  private markdownOverride = new WeakMap<WorkspaceLeaf, string>();
  private switchingLeaves = new WeakSet<WorkspaceLeaf>();

  async onload(): Promise<void> {
    await this.loadSettings();
    this.linter = new NoteMetadataLinter(this.app);
    await this.linter.reloadCanonicalTags(this.settings);

    this.registerView(HTML_NOTE_VIEW_TYPE, (leaf) => new FullHtmlLeafView(leaf, this));
    this.addSettingTab(new HtmlNoteViewSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(async () => {
      await this.linter.reloadCanonicalTags(this.settings);
      if (this.settings.autoOpenHtmlView) {
        await this.checkAndConvertOpenLeaves();
      }
    });

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf) {
          void this.maybeConvertLeafToHtml(leaf);
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        if (this.settings.autoOpenHtmlView) {
          void this.checkAndConvertOpenLeaves();
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file, _source, leaf) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        if (!this.getHtmlTargetSync(file)) return;
        if (leaf && leaf.view.getViewType() === 'markdown') {
          const i18n = t(this.settings.language);
          menu.addItem((item) => {
            item
              .setTitle(i18n.menuToHtml)
              .setIcon('globe')
              .onClick(() => {
                void this.switchLeafToHtml(leaf, file);
              });
          });
        }
      })
    );

    this.toggleCommand = this.addCommand({
      id: 'toggle-html-markdown-view',
      name: t(this.settings.language).cmdToggleView,
      checkCallback: (checking: boolean) => {
        const leaf = this.app.workspace.getMostRecentLeaf();
        const view = leaf?.view;
        if (!leaf || !(view instanceof FileView) || !view.file) return false;
        const file = view.file;

        if (view.getViewType() === HTML_NOTE_VIEW_TYPE) {
          if (!checking) void this.switchLeafToMarkdown(leaf, file);
          return true;
        }
        if (view.getViewType() === 'markdown' && this.getHtmlTargetSync(file)) {
          if (!checking) void this.switchLeafToHtml(leaf, file);
          return true;
        }
        return false;
      },
    });

    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        if (this.getHtmlTargetSync(file) || this.hasDocPageClass(file)) {
          this.linter.lintNote(file, this.settings);
        }
        for (const leaf of this.app.workspace.getLeavesOfType(HTML_NOTE_VIEW_TYPE)) {
          if (leaf.view instanceof FullHtmlLeafView && leaf.view.file?.path === file.path) {
            void leaf.view.renderCurrentFile(file);
          }
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('modify', async (file) => {
        const specPath = this.settings.canonicalTagSpecPath.trim();
        if (specPath && file.path === specPath) {
          await this.linter.reloadCanonicalTags(this.settings);
          return;
        }
        if (file instanceof TFile && /^(html|htm)$/i.test(file.extension)) {
          for (const leaf of this.app.workspace.getLeavesOfType(HTML_NOTE_VIEW_TYPE)) {
            if (
              leaf.view instanceof FullHtmlLeafView &&
              leaf.view.targetHtmlPath === file.path &&
              leaf.view.file
            ) {
              void leaf.view.renderCurrentFile(leaf.view.file);
            }
          }
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on('css-change', () => {
        this.refreshAllHtmlLeaves();
      })
    );

    // Intercept clicks on the HTML wikilink inside Markdown Properties panel to enter Full HTML View seamlessly
    this.registerDomEvent(
      document,
      'click',
      (evt: MouseEvent) => {
        const target = evt.target instanceof Element ? evt.target : null;
        if (!target) return;

        const propEl = target.closest('.metadata-property');
        if (!propEl) return;
        const propKey = propEl.getAttribute('data-property-key') || '';
        const configuredKeys = this.getPropertyKeyList();
        if (!configuredKeys.includes(propKey)) return;

        const linkEl = target.closest('.internal-link, .metadata-link-inner, .external-link');
        if (!linkEl) return;

        const leaf = this.app.workspace.getMostRecentLeaf();
        const view = leaf?.view;
        if (!leaf || !(view instanceof FileView) || view.getViewType() !== 'markdown' || !view.file) {
          return;
        }
        const file = view.file;
        if (!this.getHtmlTargetSync(file)) return;

        evt.preventDefault();
        evt.stopPropagation();
        if (evt.metaKey || evt.ctrlKey) {
          const newLeaf = this.app.workspace.getLeaf('tab');
          void this.switchLeafToHtml(newLeaf, file);
        } else {
          void this.switchLeafToHtml(leaf, file);
        }
      },
      true
    );
  }

  onunload(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(HTML_NOTE_VIEW_TYPE)) {
      if (leaf.view instanceof FullHtmlLeafView && leaf.view.file) {
        void leaf.setViewState({
          type: 'markdown',
          state: { file: leaf.view.file.path },
        });
      }
    }
  }

  async loadSettings(): Promise<void> {
    const saved = (await this.loadData()) as Partial<HtmlNoteViewSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshCommandAndButtonsLocale(): void {
    const i18n = t(this.settings.language);
    if (this.toggleCommand) {
      this.toggleCommand.name = `${this.manifest.name}: ${i18n.cmdToggleView}`;
    }
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      const btn = leaf.view.containerEl.querySelector<HTMLButtonElement>('.html-note-return-btn');
      if (btn) {
        btn.setAttribute('aria-label', i18n.actionToHtml);
      }
    }
  }

  refreshAllHtmlLeaves(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(HTML_NOTE_VIEW_TYPE)) {
      if (leaf.view instanceof FullHtmlLeafView && leaf.view.file) {
        void leaf.view.renderCurrentFile(leaf.view.file);
      }
    }
  }

  getPropertyKeyList(): string[] {
    const keys = parseCsvList(this.settings.propertyKeys);
    return keys.length > 0 ? keys : ['html'];
  }

  getHtmlTargetSync(file: TFile): string | null {
    if (file.extension !== 'md') return null;
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!fm) return null;
    for (const key of this.getPropertyKeyList()) {
      if (fm[key] !== undefined) {
        const hit = normalizeHtmlTarget(fm[key]);
        if (hit) return hit;
      }
    }
    return null;
  }

  async getHtmlTargetFromNote(file: TFile): Promise<string | null> {
    const syncHit = this.getHtmlTargetSync(file);
    if (syncHit) return syncHit;

    try {
      const head = (await this.app.vault.cachedRead(file)).slice(0, 1500);
      return extractHtmlFromRawFrontmatter(head, this.getPropertyKeyList());
    } catch {
      return null;
    }
  }

  hasDocPageClass(file: TFile): boolean {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!fm || !fm.cssclasses) return false;
    const raw = fm.cssclasses;
    const classes = Array.isArray(raw) ? raw : [raw];
    return classes.includes('doc-page');
  }

  resolveHtmlAttachment(relOrLink: string, sourcePath: string): TFile | null {
    const clean = normalizeHtmlTarget(relOrLink);
    if (!clean) return null;

    const viaLink = this.app.metadataCache.getFirstLinkpathDest(clean, sourcePath);
    if (viaLink instanceof TFile) return viaLink;

    const folder = sourcePath.includes('/')
      ? sourcePath.slice(0, sourcePath.lastIndexOf('/'))
      : '';
    const joined = folder ? `${folder}/${clean}` : clean;
    const candidate =
      this.app.vault.getAbstractFileByPath(joined) ||
      this.app.vault.getAbstractFileByPath(clean);
    return candidate instanceof TFile ? candidate : null;
  }

  private ensureMarkdownReturnButton(leaf: WorkspaceLeaf, file: TFile): void {
    if (leaf.view.getViewType() !== 'markdown') return;
    const actionsEl = leaf.view.containerEl.querySelector('.view-actions');
    if (!actionsEl) return;

    let btn = actionsEl.querySelector<HTMLButtonElement>('.html-note-return-btn');
    const isHtmlBacked = Boolean(this.getHtmlTargetSync(file));
    if (!isHtmlBacked) {
      btn?.remove();
      return;
    }

    const i18n = t(this.settings.language);
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'clickable-icon view-action html-note-return-btn';
      setIcon(btn, 'globe');
      actionsEl.prepend(btn);
    }
    btn.setAttribute('aria-label', i18n.actionToHtml);
    btn.onclick = () => {
      void this.switchLeafToHtml(leaf, file);
    };
  }

  async checkAndConvertOpenLeaves(): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      await this.maybeConvertLeafToHtml(leaf);
    }
  }

  async maybeConvertLeafToHtml(leaf: WorkspaceLeaf): Promise<void> {
    if (leaf.view.getViewType() !== 'markdown') return;
    if (this.switchingLeaves.has(leaf)) return;
    if (!(leaf.view instanceof FileView) || !(leaf.view.file instanceof TFile)) return;

    const file = leaf.view.file;
    if (file.extension !== 'md') return;

    const overriddenPath = this.markdownOverride.get(leaf);
    if (overriddenPath) {
      if (overriddenPath === file.path) {
        this.ensureMarkdownReturnButton(leaf, file);
        return;
      }
      this.markdownOverride.delete(leaf);
    }

    if (!this.settings.autoOpenHtmlView) {
      this.ensureMarkdownReturnButton(leaf, file);
      return;
    }

    const htmlTarget = await this.getHtmlTargetFromNote(file);
    if (!htmlTarget) {
      this.ensureMarkdownReturnButton(leaf, file);
      return;
    }

    await this.switchLeafToHtml(leaf, file);
  }

  async switchLeafToHtml(leaf: WorkspaceLeaf, file: TFile): Promise<void> {
    this.markdownOverride.delete(leaf);
    this.switchingLeaves.add(leaf);
    try {
      await leaf.setViewState(
        {
          type: HTML_NOTE_VIEW_TYPE,
          state: { file: file.path },
        },
        { popstate: true }
      );
    } finally {
      this.switchingLeaves.delete(leaf);
    }
  }

  async switchLeafToMarkdown(leaf: WorkspaceLeaf, file: TFile): Promise<void> {
    this.markdownOverride.set(leaf, file.path);
    this.switchingLeaves.add(leaf);
    try {
      await leaf.setViewState(
        {
          type: 'markdown',
          state: { file: file.path },
        },
        { popstate: true }
      );
      this.ensureMarkdownReturnButton(leaf, file);
    } finally {
      this.switchingLeaves.delete(leaf);
    }
  }
}
