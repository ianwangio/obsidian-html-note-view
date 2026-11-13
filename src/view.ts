import { FileView, Menu, TFile, WorkspaceLeaf } from 'obsidian';
import { escapeHtml, prepareHtmlSrcdoc } from './bridge';
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

    this.addAction('file-code', '切换为 Markdown 视图（编辑属性 / 检索摘要）', () => {
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

  onPaneMenu(menu: Menu, source: string): void {
    menu.addItem((item) => {
      item
        .setTitle('切换为 Markdown 视图（编辑属性 / 检索摘要）')
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

    const htmlTarget = await this.plugin.getHtmlTargetFromNote(file);
    if (!htmlTarget) {
      this.iframe.srcdoc = `<body style="font-family:system-ui,sans-serif;padding:32px;color:#94a3b8;background:#0f172a;">未在 <code>${escapeHtml(file.path)}</code> 的 frontmatter 中找到 HTML 关联属性（如 <code>html: "[[attachments/xxx.html]]"</code>）。</body>`;
      return;
    }

    const htmlFile = this.plugin.resolveHtmlAttachment(htmlTarget, file.path);
    if (!(htmlFile instanceof TFile)) {
      this.iframe.srcdoc = `<body style="font-family:system-ui,sans-serif;padding:32px;color:#ef4444;background:#0f172a;">找不到关联的 HTML 文件：<code>${escapeHtml(htmlTarget)}</code></body>`;
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
