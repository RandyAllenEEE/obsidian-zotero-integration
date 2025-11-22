# Zotero Integration (Desktop Connector)

**Zotero Integration** 是一个强大的 Obsidian 插件，旨在将 Zotero 中的文献引用、参考书目、笔记以及 PDF 标注（高亮和图片截图）无缝导入到 Obsidian 中。

本插件需要配合 Zotero 的 **[Better BibTeX](https://retorque.re/zotero-better-bibtex/installation/)** 插件使用。

> 本项目基于 **[obsidian-zotero-integration](https://github.com/mgmeyers/obsidian-zotero-integration)** 开发。
> 核心逻辑与架构归功于原作者 **mgmeyers**。
>
> This project is a fork/enhanced version based on **[obsidian-zotero-integration](https://github.com/mgmeyers/obsidian-zotero-integration)**. All credits for the original idea and core implementation go to **mgmeyers**. This version includes fixes for file naming compatibility and customized templates.

## ✨ 主要功能 (Features)

1.  **深度 Zotero 集成**：直接从 Zotero 数据库提取元数据、笔记和附件信息。
2.  **PDF 标注提取**：支持提取 PDF 中的高亮文本和区域截图，并将其转换为 Obsidian 的引用或嵌入图片。
3.  **🛠️ 文件名兼容性增强 (Enhanced)**：
    * 修复了当论文标题中包含 `/`、`:` 等文件系统非法字符时（例如 "CP/IP Protocol"），导致无法创建笔记或路径错误的问题。
    * 引入了更严格的 `sanitize` 过滤器，确保跨平台文件名的安全性。
4.  **📝 强大的预设模板 (New!)**：
    * 内置了高度定制的 `template.md`。
    * 支持根据 Zotero 标注的**颜色**自动分类（如：背景、重点、原理、应用、疑惑等）。
    * 自动提取元数据（作者、发表日期、DOI、期刊/会议名称等，提取项目和保留项目需要在模板中提前选定）。

## 📥 安装 (Installation)

这是一个手动构建版本，请按照以下步骤安装：

1.  进入您的 Obsidian 仓库目录：`.obsidian/plugins/`。
2.  新建文件夹 `obsidian-zotero-desktop-connector`。
3.  将 `main.js`, `manifest.json`, `styles.css`, `data.json` 以及 `template.md` 放入该文件夹。
4.  重启 Obsidian，在“第三方插件”设置中启用 **Zotero Integration**。

## 🚀 设置与配置 (Configuration)

### 1. 基础设置
在使用前，请确保您已安装并运行 **Zotero**，且在 Zotero 中安装了 **Better BibTeX** 插件。

* **Database**: 选择 `Zotero`。
* **Note Import Location**: 设置文献笔记存放的文件夹（例如：`文献/`）。

### 2. 🎨 标注颜色映射 (Annotation Colors)
本插件附带的模板 (`template.md`) 能够识别 Zotero PDF 阅读器中的颜色，并将其分类到不同的章节，这一配置最好和zotero**[Ethereal Style]https://github.com/MuiseDestiny/ZoteroStyle**插件联动：

* 🟨 **#ffd400 (Yellow)**: 背景 (Background)
* 🟥 **#ff6666 (Red)**: 重点 (Important/Focus)
* 🟩 **#5fb236 (Green)**: 原理 (Principle)
* 🟦 **#2ea8e5 (Blue)**: 应用 (Application)
* 🟪 **#a28ae5 (Purple)**: 特性 (Characteristics)
* 🟣 **#e56eee (Magenta)**: 疑惑 (Question/Doubt)
* 🟧 **#f19837 (Orange)**: 方法 (Method)
* ⬜ **#aaaaaa (Gray)**: 参数 (Parameters)

### 3. 📄 模板配置 (Templating)
在插件设置的 **Import Formats** 中，已预设了一个名为 `Import` 的格式：

* **Output Path**: `毕设/文献/{{title | sanitize}}.md` (利用新的 sanitize 过滤器处理文件名)
* **Image Output Path**: `文献/assets/`
* **Template File**: 选择 `文献模板.md`

### 4. 🔌 PDF 图像提取 (Image Extraction)
如果您需要从 PDF 中提取矩形截图（Image Excerpt）：

1.  在设置中找到 **PDF Utility**。
2.  点击下载或指定 `pdfannots2json` 的路径。
3.  确保开启 **Enable Annotation Concatenation**（可选，用于合并跨页标注）。

---

## 常见问题 (FAQ)

**Q: 为什么我的笔记文件名乱码或者无法创建？**
A: 本版本专门修复了此问题。请确保在 Output Path 设置中使用了 `{{title | sanitize}}`，`sanitize` 过滤器会自动移除标题中的 `/`、`:`、`?` 等非法字符。

**Q: 模板中的 `{% persist "notes" %}` 是什么意思？**
A: 这是为了防止重新导入文献时覆盖您自己在 Obsidian 中手动撰写的笔记。在 `%% begin notes %%` 和 `%% end notes %%` 之间的内容在更新时会被保留。

**Q: 原始文档在哪里？**
A: 插件的完整原始文档请参考 [这里](https://github.com/mgmeyers/obsidian-zotero-integration/blob/main/docs/README.md)。
