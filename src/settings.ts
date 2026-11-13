import { App, PluginSettingTab, Setting } from 'obsidian';
import type HtmlNoteViewPlugin from './main';
import { BadgePosition } from './types';

export class HtmlNoteViewSettingTab extends PluginSettingTab {
  plugin: HtmlNoteViewPlugin;

  constructor(app: App, plugin: HtmlNoteViewPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'HTML Note View — 视图与接管设置' });

    new Setting(containerEl)
      .setName('关联 HTML 的 Frontmatter 属性名')
      .setDesc('支持多个键名（逗号分隔），推荐使用双链写法如 html: "[[attachments/demo.html]]"。')
      .addText((text) =>
        text
          .setPlaceholder('html, html-file')
          .setValue(this.plugin.settings.propertyKeys)
          .onChange(async (value) => {
            this.plugin.settings.propertyKeys = value || 'html';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('打开笔记时自动进入全屏网页视图')
      .setDesc('开启后，包含 html 属性的 .md 笔记默认以 100% 全屏标签页渲染；仍可随时点右上角图标切回 Markdown。')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoOpenHtmlView).onChange(async (value) => {
          this.plugin.settings.autoOpenHtmlView = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('自动同步 Obsidian 亮暗主题')
      .setDesc('将 Obsidian 当前深浅色实时同步至 HTML 根节点的 data-theme="dark|light" 属性。')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.syncTheme).onChange(async (value) => {
          this.plugin.settings.syncTheme = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllHtmlLeaves();
        })
      );

    containerEl.createEl('h2', { text: '悬浮元数据胶囊栏（Status & Tags）' });

    new Setting(containerEl)
      .setName('在网页角落显示状态与标签胶囊栏')
      .setDesc('从宿主 .md 的 frontmatter 读取 status、tags 与更新日期，可一键折叠。')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showCornerBadge).onChange(async (value) => {
          this.plugin.settings.showCornerBadge = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllHtmlLeaves();
        })
      );

    new Setting(containerEl)
      .setName('胶囊栏悬浮位置')
      .setDesc('选择右上角或右下角展示元数据胶囊栏。')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('top-right', '右上角 (Top Right)')
          .addOption('bottom-right', '右下角 (Bottom Right)')
          .setValue(this.plugin.settings.badgePosition)
          .onChange(async (value) => {
            this.plugin.settings.badgePosition = value as BadgePosition;
            await this.plugin.saveSettings();
            this.plugin.refreshAllHtmlLeaves();
          })
      );

    new Setting(containerEl)
      .setName('右上角顶部偏移距离 (px)')
      .setDesc('避让 HTML 页面自身的吸顶导航栏（默认 64px）。')
      .addText((text) =>
        text
          .setPlaceholder('64')
          .setValue(String(this.plugin.settings.badgeOffsetPx))
          .onChange(async (value) => {
            const parsed = parseInt(value, 10);
            if (!Number.isNaN(parsed) && parsed >= 0) {
              this.plugin.settings.badgeOffsetPx = parsed;
              await this.plugin.saveSettings();
              this.plugin.refreshAllHtmlLeaves();
            }
          })
      );

    containerEl.createEl('h2', { text: '保存时标签与状态校验（Metadata Linter）' });

    new Setting(containerEl)
      .setName('启用 Frontmatter 标签与状态自动 Lint')
      .setDesc('当修改 HTML 笔记的 tags 或 status 时自动校验格式，违规时弹出提示。')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableLint).onChange(async (value) => {
          this.plugin.settings.enableLint = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('强制英文小写 kebab-case 标签格式')
      .setDesc('仅允许小写字母、数字、连字符 "-" 及最多两层 "/" 嵌套，禁止中文、大写或冒号 ":"。')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enforceKebabCaseTags).onChange(async (value) => {
          this.plugin.settings.enforceKebabCaseTags = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('单篇笔记标签数量上限')
      .setDesc('超过该数量时提醒精简（填 0 表示不限制，推荐 4）。')
      .addText((text) =>
        text
          .setPlaceholder('4')
          .setValue(String(this.plugin.settings.maxTags))
          .onChange(async (value) => {
            const parsed = parseInt(value, 10);
            if (!Number.isNaN(parsed) && parsed >= 0) {
              this.plugin.settings.maxTags = parsed;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName('合法的 status 取值集合')
      .setDesc('逗号分隔的允许状态列表；留空则不校验 status 取值范围。')
      .addTextArea((area) =>
        area
          .setPlaceholder('seeding, exploring, converging, crystallized, evergreen')
          .setValue(this.plugin.settings.validStatuses)
          .onChange(async (value) => {
            this.plugin.settings.validStatuses = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('禁止打标的默认标签（可选）')
      .setDesc('逗号分隔，例如默认态标签 "build" 不应显式写入 frontmatter。')
      .addText((text) =>
        text
          .setPlaceholder('build')
          .setValue(this.plugin.settings.forbiddenTags)
          .onChange(async (value) => {
            this.plugin.settings.forbiddenTags = value;
            await this.plugin.saveSettings();
            await this.plugin.linter.reloadCanonicalTags(this.plugin.settings);
          })
      );

    new Setting(containerEl)
      .setName('受控标签字典笔记路径（可选）')
      .setDesc(
        '库内标签规范 Markdown 路径（如 metaspace/spec/标签约定.md），自动提取表格中的 `tag` 作为白名单；留空则不限词表。'
      )
      .addText((text) =>
        text
          .setPlaceholder('metaspace/spec/标签约定.md')
          .setValue(this.plugin.settings.canonicalTagSpecPath)
          .onChange(async (value) => {
            this.plugin.settings.canonicalTagSpecPath = value.trim();
            await this.plugin.saveSettings();
            await this.plugin.linter.reloadCanonicalTags(this.plugin.settings);
          })
      );
  }
}
