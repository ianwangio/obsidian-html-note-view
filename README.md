# Obsidian HTML Note View

像 Excalidraw / Kanban 一样，在 Obsidian 中以 **100% 全屏无边距标签页**渲染 AI 生成的交互式 HTML 页面（架构全景图、可筛选对比表、交互看板），同时 **100% 原生保留** Markdown Frontmatter、`Bases`（`.base`）数据库标签过滤、双向链接图谱、全局全文搜索（`Cmd/Ctrl + Shift + F`）以及保存时自动标签校验（Linter）。

---

## 为什么需要这个插件？

当让 AI Coding Agent（Claude Code、Codex、Cursor、Antigravity 等）生成复杂架构图、多维对比模拟器或高信息密度技术手册时，纯 Markdown 往往捉襟见肘，而 HTML + 内联 CSS/SVG/JS 表现力极强。但直接往 Obsidian 知识库里放裸 `.html` 文件会撞上三大痛点：

1. **`.base` 数据库视图看不见标签与状态**：Obsidian 核心插件 `Bases` 在内核层硬性拦截非 `.md` 扩展名（`extension === "md"`），裸 `.html` 即使打补丁也无法在 `.base` 表格里展示 `tags`、`status`、`summary`。
2. **Markdown 内嵌 `<iframe>` 视野局促**：受限于笔记正文行宽（如 `880px`）、内联标题栏与属性头，网页被挤在中间窄窄一条，还会产生双重滚动条。
3. **Electron `srcdoc` 目录锚点失效**：在沙盒/内联视图中点击 `<a href="#section">` 目录无法滚动跳转，外链还容易把当前面板跳丢。

**HTML Note View 采用与 Excalidraw / Kanban 相同的「薄 `.md` 宿主 + `.html` 附件接管」架构**：
- **磁盘层**：笔记本体依然是标准 `.md` 文件（承载 YAML `status` / `tags` / `summary`、`html: "[[attachments/xxx.html]]"` 双链与全文检索摘要），交互网页存放在同目录 `attachments/` 下。
- **视图层**：点开该 `.md` 笔记时，插件自动将当前标签页无缝切换为 **100% 贴边铺满的全屏 HTML 视图**，并在右上角自动注入可折叠的 `status + #tags` 胶囊栏；需要改属性或看摘要时，点一下标签页标题栏右上角的 `</>` 图标即可一键切回 Markdown 视图。

---

## 核心特性

- **100% 全屏标签页接管 & 一键互切**：点开即全屏网页，零内边距、零双重滚动条；标题栏右上角一键在 `</>`（Markdown 属性/摘要视图）与 `🌐`（全屏网页视图）之间切换。
- **`html` 属性原生双链可点击**：支持 `html: "[[attachments/xxx.html]]"` 写法——在 Markdown **文档属性（Properties）** 面板与 **`.base` 表格**中均渲染为原生可点击链接；移动或重命名 HTML 文件时 Obsidian 自动更新路径不断链，点击该链接直接进入全屏网页视图（按住 `Cmd/Ctrl` 点击在新标签页打开）。
- **右上角悬浮元数据胶囊栏**：自动从宿主 `.md` 读取 `status`、`tags` 与更新日期，以毛玻璃胶囊悬浮在右上角（或右下角），支持一键折叠为 `🏷️` 小图标，修改 `.base` 表格或属性后实时热刷新。
- **深浅色主题自动联动**：实时监听 Obsidian 亮暗模式切换，自动同步 `<html data-theme="dark|light">`。
- **内置 `srcdoc` 链接与目录桥接**：
  - 点击 `<a href="#section-id">` 页内目录自动平滑滚动（尊重 `scroll-margin-top`）并同步目录 `.active` 高亮；
  - 点击 `http://` / `https://` 外链自动调用系统默认浏览器打开；
  - 点击库内相对路径自动交由 Obsidian 路由打开对应笔记。
- **保存时标签与状态自动 Lint**：修改笔记属性保存时自动校验 `kebab-case` 标签格式、单篇标签数量上限、合法 `status` 集合，并支持绑定库内受控标签词表笔记（如 `metaspace/spec/标签约定.md`）。

---

## 快速上手

### 1. 安装插件

#### 方式 A：源码构建（开发 / 本地使用）
将本仓库克隆或放入知识库的 `.obsidian/plugins/html-note-view/` 目录：

```bash
cd /path/to/your-vault/.obsidian/plugins/html-note-view
npm install
npm run build
```

打开 Obsidian → `设置 → 第三方插件` → 刷新并启用 **HTML Note View**（若已开启，可用命令面板 `Cmd/Ctrl + P` 执行 `重新加载应用，不保存`）。

> 💡 **注意**：Obsidian 在 macOS 上默认未绑定 `Cmd + R` 刷新快捷键，重载插件请在第三方插件列表中关开一次，或按 `Cmd + P` 搜索 `重新加载应用，不保存`（`Reload app without saving`）。

#### 方式 B：手动安装 Release 产物
从 GitHub Releases 下载 `main.js`、`manifest.json`、`styles.css` 三个文件，放入 `<你的知识库>/.obsidian/plugins/html-note-view/` 后在第三方插件中启用即可。

### 2. 创建一篇全屏 HTML 笔记

目录结构：

```text
notes/
├── Centrifugo 功能全景.md
└── attachments/
    └── centrifugo-功能全景.html
```

宿主笔记 `notes/Centrifugo 功能全景.md` 示例：

```markdown
---
title: Centrifugo 功能全景
summary: Go 编写的独立实时消息网关（v6），将百万级长连接从无状态业务后端彻底剥离
status: exploring
tags: [messaging, agent-arch]
html: "[[attachments/centrifugo-功能全景.html]]"
created: 2026-11-13
updated: 2026-11-13
---

# Centrifugo 功能全景（检索摘要层）

- **核心定位**：独立实时消息网关，支持 WebSocket / HTTP-Streaming / SSE / WebTransport。
- **断线恢复**：基于 `(offset, epoch)` 滑动窗口自动补发断网漏消息。
- **后端桥接**：HTTP/gRPC Server API、反向 Proxy、原生 PostgreSQL Outbox / Kafka 异步消费者。
```

---

## 🤖 加入 `AGENTS.md` / `CLAUDE.md` 的提示词规约（直接复制使用）

为了让 Claude Code、Codex、Cursor、Antigravity 等 AI 协作者生成的 HTML 笔记每次都自动适配本插件、通过标签 Linter 校验、并且能被 `.base` 视图和全局搜索 100% 命中，请将以下片段直接复制到你知识库根目录的 **`AGENTS.md`**（或 `CLAUDE.md`）中：

````markdown
## 交互式 HTML 笔记规范（适配 HTML Note View 插件）

当需要输出高信息密度的交互式看板、可筛选全景手册、SVG 拓扑模拟器等多媒体/富交互文档时，**严禁直接裸放孤立的 `.html` 文件**（Obsidian `.base` 数据库视图不索引非 `.md` 文件的属性与标签），必须采用**「薄 `.md` 宿主 + `attachments/*.html` 附件」**双文件结构：

### 1. 文件落盘结构
- **宿主笔记**：`<目标目录>/<人类可读标题>.md`（承载 YAML 元数据、双向链接与全文检索摘要）
- **网页附件**：`<同一目录>/attachments/<简短文件名>.html`（单文件自包含 HTML）

### 2. 宿主 `.md` 的 Frontmatter 必填规范
```yaml
---
title: 人类可读标题
summary: 一句话核心摘要（供索引与 .base 数据库表格直接展示）
status: exploring
tags: [messaging, distributed-systems]
html: "[[attachments/文件名.html]]"
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: ["[[关联笔记名]]"]
---
```
- **`html` 字段必须用带引号的 Obsidian Wikilink**：统一写作 `html: "[[attachments/xxx.html]]"`（或同库唯一文件名 `"[[xxx.html]]"`），**不要写裸相对路径**。这样该字段在 Obsidian「文档属性」面板与 `.base` 视图中天然可点击跳转，重命名或移动附件时也会自动更新不断链。
- **`status` 状态机**：只填写知识库合法的状态值（知识空间：`seeding` / `exploring` / `converging` / `crystallized` / `dormant` / `archived` / `evergreen`；产品空间：`draft` / `final` / `implemented` / `superseded`）。

### 3. `tags`（标签）书写硬规则（保存时自动 Lint）
1. **格式铁律（英文小写 `kebab-case`）**：
   - 标签只能包含小写英文字母 `a-z`、数字 `0-9` 和连字符 `-`（例如 `prompt-caching`、`agent-arch`、`real-time`）。
   - **严禁**中文标签、大写字母、空格或下划线 `_`。
2. **层级语法（只准用 `/`，严禁用 `:`）**：
   - 确需父子层级时使用 Obsidian 原生斜杠 `/` 且**最多两层**（如 `energy/nuclear`）。
   - **绝对不要用冒号 `:`**（`:` 在 Obsidian 中不是合法标签字符，会导致标签断裂失效）。
3. **数量克制**：每篇笔记控制在 **2–4 个**标签以内，宁缺毋滥。
4. **概念打 `tags`，专有实体走 `[[wikilink]]`**：
   - 判断标准：「这个词未来还会贴到 3 篇以上不同主题的笔记上吗？」
   - 会（领域、技术范式、通用概念，如 `messaging`、`auth`、`eval`）→ 放进 `tags`。
   - 不会（具体开源项目、商业产品、公司、人名，如 `Centrifugo`、`Kafka`、`Cloudflare`）→ **不建标签**，改在正文或 `related` 中写 `[[wikilink]]`。
5. **状态与标签分离**：文档成熟度统一归 `status` 字段管理，不要把 `draft`、`todo`、`evergreen` 等状态词重复塞进 `tags`。
6. **对齐受控词表**（若库内维护了标签规范文件，如 `metaspace/spec/标签约定.md`）：落盘打标前先查阅现有 canonical 标签表并优先复用，未经用户确认不擅自发明新标签。

### 4. 宿主 `.md` 正文必须保留「全文检索摘要层」
Obsidian 原生全局搜索（`Cmd/Ctrl + Shift + F`）主要索引 `.md` 正文。生成完 `.html` 附件后，**必须**在宿主 `.md` 正文中同步写一份 10–30 行的结构化检索摘要（包含核心结论、关键模块名称、英文专有术语、核心配置项/API 名），确保用户全局搜任何关键术语都能命中这篇笔记。

### 5. HTML 附件编写规范（适配全屏容器与插件桥接）
1. **深浅色双主题自适应**：
   - 根节点固定声明 `<html lang="zh-CN" data-theme="dark">`。
   - CSS 必须同时提供 `:root`（深色默认变量）与 `[data-theme="light"]`（浅色覆盖变量）；内联 SVG 线条与文字优先使用 `currentColor`。插件会随 Obsidian 主题自动同步切换 `data-theme`。
2. **右上角元数据区避让（勿重复造徽章）**：
   - 插件会在页面右上角（默认 `top: 64px; right: 22px`）自动悬浮注入 `status + #tags + updated` 胶囊栏。HTML 页面内部**不要**重复手写右上角标签栏，吸顶顶栏控件注意避开该遮挡区。
3. **目录跳转与链接写法**：
   - 章节节点使用 `<section id="xxx">` 并加上 `scroll-margin-top: 84px`（防止吸顶头部遮挡标题）。
   - 侧边栏/顶部目录直接使用标准 `<a href="#xxx">`，外部参考链接正常写 `<a href="https://...">`——插件内置桥接会自动接管目录平滑滚动与外链系统浏览器跳转。
4. **单文件零依赖**：所有 CSS、SVG 与交互 JS 内联在单个 `.html` 文件中，不依赖外部构建工具或失效风险高的第三方脚本，保证离线秒开。
````

---

## 插件配置项说明

在 `设置 → HTML Note View` 中可按个人知识库习惯自由调整：

| 配置项 | 默认值 | 说明 |
|---|---|---|
| **关联 HTML 的 Frontmatter 属性名** | `html, html-file` | 触发全屏网页视图的属性键名（逗号分隔） |
| **打开笔记时自动进入全屏网页视图** | 开启 | 点开带 `html` 属性的笔记直接全屏展示网页；关闭则默认停留在 Markdown |
| **自动同步 Obsidian 亮暗主题** | 开启 | 自动向 `<html data-theme="...">` 同步 `dark` 或 `light` |
| **在网页角落显示状态与标签胶囊栏** | 开启 | 自动渲染宿主 `.md` 的 `status`、`#tags` 与日期 |
| **胶囊栏悬浮位置 / 顶部偏移** | `top-right` / `64px` | 可切换右上角或右下角，并调节避让吸顶导航栏的像素高度 |
| **启用 Frontmatter 标签与状态自动 Lint** | 开启 | 属性保存变更时实时校验 `tags` 与 `status` |
| **强制英文小写 kebab-case 标签格式** | 开启 | 拦截大写、中文、空格与 `:` 等违规标签写法 |
| **单篇笔记标签数量上限** | `4` | 超出上限时弹出温和告警（设为 `0` 则不限制） |
| **合法的 `status` 取值集合** | 知识库与产品双空间状态集 | 逗号分隔；留空则允许任意 `status` |
| **受控标签字典笔记路径（可选）** | 空（可填如 `metaspace/spec/标签约定.md`） | 自动解析该笔记 Markdown 表格第一列中的 `` `tag` `` 作为白名单 |

---

## 本地开发与发布流程

```bash
# 安装依赖
npm install

# 开发监听模式（修改 src/*.ts 自动增量编译 main.js）
npm run dev

# 类型检查 + 生产压缩构建
npm run build
```

发布首个或新版本 GitHub Release（可直接通过 `gh` CLI 上传构建产物；如需开启自动发版流水线，将仓库内 `scripts/github-release-workflow.yml` 移至 `.github/workflows/release.yml` 即可）：

```bash
npm run build
git tag 0.1.0
git push origin 0.1.0
gh release create 0.1.0 main.js manifest.json styles.css --title "0.1.0" --generate-notes
```

## License

[MIT](./LICENSE)
