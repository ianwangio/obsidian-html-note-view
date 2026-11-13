import { moment } from 'obsidian';
import { LanguageSetting } from './types';

export type ResolvedLocale = 'en' | 'zh';

export function resolveLocale(setting: LanguageSetting = 'auto'): ResolvedLocale {
  if (setting === 'en' || setting === 'zh') return setting;
  try {
    const stored =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('language') || ''
        : '';
    const raw = (stored || moment.locale() || '').toLowerCase();
    if (raw.startsWith('zh')) return 'zh';
  } catch {
    // Fallback to English if locale lookup fails
  }
  return 'en';
}

export interface Translations {
  // Commands & View Actions
  cmdToggleView: string;
  actionToMarkdown: string;
  actionToHtml: string;
  menuToMarkdown: string;
  menuToHtml: string;
  badgeAriaLabel: string;
  badgeToggleTitle: string;
  errMissingProperty: (filePath: string) => string;
  errMissingHtmlFile: (target: string) => string;

  // Linter Notices
  lintNoticeHeader: (fileName: string) => string;
  lintInvalidStatus: (status: string) => string;
  lintTooManyTags: (count: number, max: number) => string;
  lintForbiddenTag: (tag: string) => string;
  lintInvalidTagFormat: (tag: string) => string;
  lintNotInCanonical: (tag: string, specPath: string) => string;

  // Settings Tab
  settingsGeneralHeading: string;
  settingLanguageName: string;
  settingLanguageDesc: string;
  settingLanguageAuto: string;
  settingPropKeysName: string;
  settingPropKeysDesc: string;
  settingAutoOpenName: string;
  settingAutoOpenDesc: string;
  settingSyncThemeName: string;
  settingSyncThemeDesc: string;

  settingsBadgeHeading: string;
  settingShowBadgeName: string;
  settingShowBadgeDesc: string;
  settingBadgePosName: string;
  settingBadgePosDesc: string;
  settingBadgePosTopRight: string;
  settingBadgePosBottomRight: string;
  settingBadgeOffsetName: string;
  settingBadgeOffsetDesc: string;

  settingsLintHeading: string;
  settingEnableLintName: string;
  settingEnableLintDesc: string;
  settingKebabTagsName: string;
  settingKebabTagsDesc: string;
  settingMaxTagsName: string;
  settingMaxTagsDesc: string;
  settingValidStatusesName: string;
  settingValidStatusesDesc: string;
  settingForbiddenTagsName: string;
  settingForbiddenTagsDesc: string;
  settingCanonicalPathName: string;
  settingCanonicalPathDesc: string;
}

const EN: Translations = {
  cmdToggleView: 'Toggle between Full HTML view and Markdown view',
  actionToMarkdown: 'Switch to Markdown view (edit properties / summary)',
  actionToHtml: 'Switch to Full HTML view',
  menuToMarkdown: 'Switch to Markdown view (edit properties / summary)',
  menuToHtml: 'Switch to Full HTML view',
  badgeAriaLabel: 'Note metadata',
  badgeToggleTitle: 'Collapse / expand metadata badge',
  errMissingProperty: (filePath) =>
    `No HTML target property (e.g. <code>html: "[[attachments/demo.html]]"</code>) found in frontmatter of <code>${filePath}</code>.`,
  errMissingHtmlFile: (target) =>
    `Target HTML file could not be found in vault: <code>${target}</code>`,

  lintNoticeHeader: (fileName) => `⚠️ Metadata Lint (${fileName}):`,
  lintInvalidStatus: (status) => `Invalid status "${status}" (not in allowed status list)`,
  lintTooManyTags: (count, max) => `Too many tags (${count}); maximum allowed is ${max}`,
  lintForbiddenTag: (tag) => `Tag "${tag}" is marked as a forbidden default tag; please remove it`,
  lintInvalidTagFormat: (tag) =>
    `Invalid tag format "${tag}" (must be lowercase kebab-case, max 2-level "/" hierarchy, no ":" or uppercase)`,
  lintNotInCanonical: (tag, specPath) =>
    `Tag "${tag}" is not listed in canonical tag dictionary (${specPath})`,

  settingsGeneralHeading: 'HTML Note View — View & Rendering',
  settingLanguageName: 'Interface language',
  settingLanguageDesc: 'Language used for plugin menus, tooltips, settings, and lint notices.',
  settingLanguageAuto: 'Auto (Follow Obsidian)',
  settingPropKeysName: 'Frontmatter HTML property keys',
  settingPropKeysDesc:
    'Comma-separated property names pointing to an HTML file, e.g. html: "[[attachments/demo.html]]".',
  settingAutoOpenName: 'Automatically open in Full HTML view',
  settingAutoOpenDesc:
    'Open .md notes containing an HTML property directly in edge-to-edge HTML view. You can switch back to Markdown anytime via the header button.',
  settingSyncThemeName: 'Sync Obsidian dark/light theme',
  settingSyncThemeDesc:
    'Automatically synchronize Obsidian’s active dark/light mode onto <html data-theme="dark|light">.',

  settingsBadgeHeading: 'Floating Metadata Badge (Status & Tags)',
  settingShowBadgeName: 'Show floating metadata badge',
  settingShowBadgeDesc:
    'Render a collapsible glassmorphism pill showing status, #tags, and updated date from the host .md frontmatter.',
  settingBadgePosName: 'Badge position',
  settingBadgePosDesc: 'Choose which corner displays the floating metadata pill.',
  settingBadgePosTopRight: 'Top right',
  settingBadgePosBottomRight: 'Bottom right',
  settingBadgeOffsetName: 'Top offset (px)',
  settingBadgeOffsetDesc:
    'Vertical offset from top edge to avoid overlapping sticky headers inside HTML pages (default: 64).',

  settingsLintHeading: 'On-Save Metadata Linter (Tags & Status)',
  settingEnableLintName: 'Enable frontmatter tag & status lint on save',
  settingEnableLintDesc:
    'Validate tags and status whenever an HTML-backed note is modified and show a notice on violations.',
  settingKebabTagsName: 'Enforce lowercase kebab-case tags',
  settingKebabTagsDesc:
    'Allow only lowercase letters, digits, hyphens "-", and up to 2-level "/" nesting. Disallow spaces, uppercase, or colons ":".',
  settingMaxTagsName: 'Maximum tags per note',
  settingMaxTagsDesc: 'Warn when tag count exceeds this limit (set 0 for unlimited; recommended: 4).',
  settingValidStatusesName: 'Allowed status values',
  settingValidStatusesDesc:
    'Comma-separated list of valid status values. Leave empty to allow any status.',
  settingForbiddenTagsName: 'Forbidden default tags (optional)',
  settingForbiddenTagsDesc:
    'Comma-separated tags that should remain implicit and not be written explicitly (e.g. "build").',
  settingCanonicalPathName: 'Canonical tag dictionary note path (optional)',
  settingCanonicalPathDesc:
    'Vault-relative path to a Markdown note containing canonical `tag` tables (e.g. metaspace/spec/tags.md). Leave empty to disable whitelist checks.',
};

const ZH: Translations = {
  cmdToggleView: '在「全屏网页视图」与「Markdown 视图」之间切换',
  actionToMarkdown: '切换为 Markdown 视图（编辑属性 / 检索摘要）',
  actionToHtml: '切换回全屏网页视图',
  menuToMarkdown: '切换为 Markdown 视图（编辑属性 / 检索摘要）',
  menuToHtml: '切换为全屏网页视图',
  badgeAriaLabel: '笔记元数据标签',
  badgeToggleTitle: '折叠 / 展开右上角标签栏',
  errMissingProperty: (filePath) =>
    `未在 <code>${filePath}</code> 的 frontmatter 中找到 HTML 关联属性（如 <code>html: "[[attachments/demo.html]]"</code>）。`,
  errMissingHtmlFile: (target) => `找不到关联的 HTML 文件：<code>${target}</code>`,

  lintNoticeHeader: (fileName) => `⚠️ 元数据 Lint 告警 (${fileName})：`,
  lintInvalidStatus: (status) => `非法 status "${status}"（不在允许的状态集合内）`,
  lintTooManyTags: (count, max) => `tags 数量 (${count}) 超过上限 (${max})`,
  lintForbiddenTag: (tag) => `标签 "${tag}" 被设为默认禁标项，请移除`,
  lintInvalidTagFormat: (tag) =>
    `标签 "${tag}" 格式不合法（须为英文小写 kebab-case，至多两级 "/" 分隔，严禁用 ":"、大写或中文）`,
  lintNotInCanonical: (tag, specPath) =>
    `标签 "${tag}" 不在受控标签词表 (${specPath}) 内`,

  settingsGeneralHeading: 'HTML Note View — 视图与渲染设置',
  settingLanguageName: '界面语言 / Interface Language',
  settingLanguageDesc: '设置插件菜单、按钮提示、配置面板与 Lint 告警的显示语言。',
  settingLanguageAuto: '自动跟随 Obsidian (Auto)',
  settingPropKeysName: '关联 HTML 的 Frontmatter 属性名',
  settingPropKeysDesc:
    '支持多个键名（逗号分隔），推荐使用双链写法如 html: "[[attachments/demo.html]]"。',
  settingAutoOpenName: '打开笔记时自动进入全屏网页视图',
  settingAutoOpenDesc:
    '开启后，包含 html 属性的 .md 笔记默认以 100% 全屏标签页渲染；仍可随时点右上角图标切回 Markdown。',
  settingSyncThemeName: '自动同步 Obsidian 亮暗主题',
  settingSyncThemeDesc:
    '将 Obsidian 当前深浅色实时同步至 HTML 根节点的 data-theme="dark|light" 属性。',

  settingsBadgeHeading: '悬浮元数据胶囊栏（Status & Tags）',
  settingShowBadgeName: '在网页角落显示状态与标签胶囊栏',
  settingShowBadgeDesc: '从宿主 .md 的 frontmatter 读取 status、#tags 与更新日期，支持一键折叠。',
  settingBadgePosName: '胶囊栏悬浮位置',
  settingBadgePosDesc: '选择在页面右上角或右下角展示元数据胶囊栏。',
  settingBadgePosTopRight: '右上角 (Top Right)',
  settingBadgePosBottomRight: '右下角 (Bottom Right)',
  settingBadgeOffsetName: '右上角顶部偏移距离 (px)',
  settingBadgeOffsetDesc: '避让 HTML 页面自身的吸顶导航栏（默认 64px）。',

  settingsLintHeading: '保存时标签与状态校验（Metadata Linter）',
  settingEnableLintName: '启用 Frontmatter 标签与状态自动 Lint',
  settingEnableLintDesc: '当修改 HTML 笔记的 tags 或 status 时自动校验格式，违规时弹出提示。',
  settingKebabTagsName: '强制英文小写 kebab-case 标签格式',
  settingKebabTagsDesc:
    '仅允许小写字母、数字、连字符 "-" 及最多两层 "/" 嵌套，禁止中文、大写或冒号 ":"。',
  settingMaxTagsName: '单篇笔记标签数量上限',
  settingMaxTagsDesc: '超过该数量时提醒精简（填 0 表示不限制，推荐 4）。',
  settingValidStatusesName: '合法的 status 取值集合',
  settingValidStatusesDesc: '逗号分隔的允许状态列表；留空则不校验 status 取值范围。',
  settingForbiddenTagsName: '禁止打标的默认标签（可选）',
  settingForbiddenTagsDesc: '逗号分隔，例如默认态标签 "build" 不应显式写入 frontmatter。',
  settingCanonicalPathName: '受控标签字典笔记路径（可选）',
  settingCanonicalPathDesc:
    '库内标签规范 Markdown 路径（如 metaspace/spec/标签约定.md），自动提取表格中的 `tag` 作为白名单；留空则不限词表。',
};

export function t(setting: LanguageSetting = 'auto'): Translations {
  return resolveLocale(setting) === 'zh' ? ZH : EN;
}
