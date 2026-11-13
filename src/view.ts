import { FileView, Menu, TFile, WorkspaceLeaf } from 'obsidian';
import { escapeHtml, prepareHtmlSrcdoc } from './bridge';
import { t } from './i18n';
import type HtmlNoteViewPlugin from './main';
import { HTML_NOTE_VIEW_TYPE } from './types';

interface IframeBridgeMessage {
  __vaultHtmlBridge?: boolean;
  action?: 'open-external' | 'open-internal';
  url?: string;
  link?: string;
  newLeaf?: boolean;
}

export class FullHtmlLeafView extends FileView {
  plugin: HtmlNoteViewPlugin;
  iframe: HTMLIFrameElement | null = null;
  targetHtmlPath: string | null = null;
  private toMarkdownActionEl: HTMLElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: HtmlNoteViewPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return HTML_NOTE_VIEW_TYPE;
  }

  getIcon(): string {
    return 'globe';
  }

  getDisplayText(): string {
    if (!this.file) return 'HTML View';
    const cache = this.app.metadataCache.getFileCache(this.file);
    const title = cache?.frontmatter?.title;
    return typeof title === 'string' && title.trim() ? title.trim() : this.file.basename;
  }

  canAcceptExtension(extension: string): boolean {
    return extension === 'md';
  }

  onload(): void {
    super.onload();

    const i18n = t(this.plugin.settings.language);
    this.toMarkdownActionEl = this.addAction('file-code', i18n.actionToMarkdown, () => {
      if (this.file) {
        void this.plugin.switchLeafToMarkdown(this.leaf, this.file);
      }
    });

    this.registerDomEvent(window, 'message', (evt: MessageEvent) => {
      const data = evt.data as IframeBridgeMessage | undefined;
      if (!data || !data.__vaultHtmlBridge) return;
      if (!this.iframe || evt.source !== this.iframe.contentWindow) return;

      if (data.action === 'open-external' && typeof data.url === 'string') {
        window.open(data.url, '_blank', 'noopener');
      } else if (data.action === 'open-internal' && typeof data.link === 'string' && this.file) {
        const basePath = this.targetHtmlPath || this.file.path;
        void this.app.workspace.openLinkText(data.link, basePath, Boolean(data.newLeaf));
      }
    });
  }

  refreshActionTooltips(): void {
    if (this.toMarkdownActionEl) {
      const label = t(this.plugin.settings.language).actionToMarkdown;
      this.toMarkdownActionEl.setAttribute('aria-label', label);
    }
  }

  onPaneMenu(menu: Menu, source: string): void {
    const i18n = t(this.plugin.settings.language);
    menu.addItem((item) => {
      item
        .setTitle(i18n.menuToMarkdown)
        .setIcon('file-code')
        .onClick(() => {
          if (this.file) {
            void this.plugin.switchLeafToMarkdown(this.leaf, this.file);
          }
        });
    });
    menu.addSeparator();
    super.onPaneMenu(menu, source);
  }

  async onLoadFile(file: TFile): Promise<void> {
    this.contentEl.empty();
    this.iframe = this.contentEl.createEl('iframe', { cls: 'html-note-view-iframe' });
    await this.renderCurrentFile(file);
  }

  async renderCurrentFile(file: TFile): Promise<void> {
    if (!file || !this.iframe) return;
    this.refreshActionTooltips();
    const i18n = t(this.plugin.settings.language);

    const htmlTarget = await this.plugin.getHtmlTargetFromNote(file);
    if (!htmlTarget) {
      this.iframe.srcdoc = `<body style="font-family:system-ui,sans-serif;padding:32px;color:#94a3b8;background:#0f172a;">${i18n.errMissingProperty(escapeHtml(file.path))}</body>`;
      return;
    }

    const htmlFile = this.plugin.resolveHtmlAttachment(htmlTarget, file.path);
    if (!(htmlFile instanceof TFile)) {
      this.iframe.srcdoc = `<body style="font-family:system-ui,sans-serif;padding:32px;color:#ef4444;background:#0f172a;">${i18n.errMissingHtmlFile(escapeHtml(htmlTarget))}</body>`;
      return;
    }

    this.targetHtmlPath = htmlFile.path;
    const rawHtml = await this.app.vault.cachedRead(htmlFile);
    const cache = this.app.metadataCache.getFileCache(file);
    const isDark = document.body.classList.contains('theme-dark');
    this.iframe.srcdoc = prepareHtmlSrcdoc(
      rawHtml,
      cache?.frontmatter,
      isDark,
      this.plugin.settings
    );
  }

  async onUnloadFile(file: TFile): Promise<void> {
    this.contentEl.empty();
    this.iframe = null;
    this.targetHtmlPath = null;
    await super.onUnloadFile(file);
  }
}
