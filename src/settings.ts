import { App, PluginSettingTab, Setting } from 'obsidian';
import { t } from './i18n';
import type HtmlNoteViewPlugin from './main';
import { BadgePosition, LanguageSetting } from './types';

export class HtmlNoteViewSettingTab extends PluginSettingTab {
  plugin: HtmlNoteViewPlugin;

  constructor(app: App, plugin: HtmlNoteViewPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const i18n = t(this.plugin.settings.language);

    containerEl.createEl('h2', { text: i18n.settingsGeneralHeading });

    new Setting(containerEl)
      .setName(i18n.settingLanguageName)
      .setDesc(i18n.settingLanguageDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption('auto', i18n.settingLanguageAuto)
          .addOption('en', 'English')
          .addOption('zh', '简体中文')
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as LanguageSetting;
            await this.plugin.saveSettings();
            this.plugin.refreshCommandAndButtonsLocale();
            this.plugin.refreshAllHtmlLeaves();
            this.display();
          })
      );

    new Setting(containerEl)
      .setName(i18n.settingPropKeysName)
      .setDesc(i18n.settingPropKeysDesc)
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
      .setName(i18n.settingAutoOpenName)
      .setDesc(i18n.settingAutoOpenDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoOpenHtmlView).onChange(async (value) => {
          this.plugin.settings.autoOpenHtmlView = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(i18n.settingSyncThemeName)
      .setDesc(i18n.settingSyncThemeDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.syncTheme).onChange(async (value) => {
          this.plugin.settings.syncTheme = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllHtmlLeaves();
        })
      );

    containerEl.createEl('h2', { text: i18n.settingsBadgeHeading });

    new Setting(containerEl)
      .setName(i18n.settingShowBadgeName)
      .setDesc(i18n.settingShowBadgeDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showCornerBadge).onChange(async (value) => {
          this.plugin.settings.showCornerBadge = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllHtmlLeaves();
        })
      );

    new Setting(containerEl)
      .setName(i18n.settingBadgePosName)
      .setDesc(i18n.settingBadgePosDesc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption('top-right', i18n.settingBadgePosTopRight)
          .addOption('bottom-right', i18n.settingBadgePosBottomRight)
          .setValue(this.plugin.settings.badgePosition)
          .onChange(async (value) => {
            this.plugin.settings.badgePosition = value as BadgePosition;
            await this.plugin.saveSettings();
            this.plugin.refreshAllHtmlLeaves();
          })
      );

    new Setting(containerEl)
      .setName(i18n.settingBadgeOffsetName)
      .setDesc(i18n.settingBadgeOffsetDesc)
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

    containerEl.createEl('h2', { text: i18n.settingsLintHeading });

    new Setting(containerEl)
      .setName(i18n.settingEnableLintName)
      .setDesc(i18n.settingEnableLintDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableLint).onChange(async (value) => {
          this.plugin.settings.enableLint = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(i18n.settingKebabTagsName)
      .setDesc(i18n.settingKebabTagsDesc)
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enforceKebabCaseTags).onChange(async (value) => {
          this.plugin.settings.enforceKebabCaseTags = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(i18n.settingMaxTagsName)
      .setDesc(i18n.settingMaxTagsDesc)
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
      .setName(i18n.settingValidStatusesName)
      .setDesc(i18n.settingValidStatusesDesc)
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
      .setName(i18n.settingForbiddenTagsName)
      .setDesc(i18n.settingForbiddenTagsDesc)
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
      .setName(i18n.settingCanonicalPathName)
      .setDesc(i18n.settingCanonicalPathDesc)
      .addText((text) =>
        text
          .setPlaceholder('metaspace/spec/tags.md')
          .setValue(this.plugin.settings.canonicalTagSpecPath)
          .onChange(async (value) => {
            this.plugin.settings.canonicalTagSpecPath = value.trim();
            await this.plugin.saveSettings();
            await this.plugin.linter.reloadCanonicalTags(this.plugin.settings);
          })
      );
  }
}
