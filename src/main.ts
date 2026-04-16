import Fuse from 'fuse.js';
import { EditableFileView, Events, Notice, Plugin, TFile } from 'obsidian';
import { shellPath } from 'shell-path';

import i18n, { detectAndSetLanguage } from './i18n/config'; // Initialize i18n and import detection function
import { DataExplorerView, viewType } from './DataExplorerView';
import { LoadingModal } from './bbt/LoadingModal';
import { getCAYW } from './bbt/cayw';
import { exportToMarkdown, renderCiteTemplate } from './bbt/export';
import { summarizePdf } from './ai/ZoteroAutoSummarize';
import {
  filesFromNotes,
  insertNotesIntoCurrentDoc,
  noteExportPrompt,
} from './bbt/exportNotes';
import './bbt/template.helpers';
import {
  currentVersion,
  downloadAndExtract,
  internalVersion,
} from './settings/AssetDownloader';
import { getLibForCiteKey } from './bbt/jsonRPC';
import { ZoteroConnectorSettingsTab } from './settings/settings';
import {
  CitationFormat,
  CiteKeyExport,
  ExportFormat,
  ZoteroConnectorSettings,
} from './types';

// Helper function to get translated strings
const t = (key: string): string => {
  return i18n.t(key);
};

const commandPrefix = 'obsidian-zotero-desktop-connector:';
const citationCommandIDPrefix = 'zdc-';
const exportCommandIDPrefix = 'zdc-exp-';
const DEFAULT_SETTINGS: ZoteroConnectorSettings = {
  database: 'Zotero',
  noteImportFolder: '',
  pdfExportImageDPI: 120,
  pdfExportImageFormat: 'jpg',
  pdfExportImageQuality: 90,
  citeFormats: [],
  exportFormats: [],
  citeSuggestTemplate: '[[{{citekey}}]]',
  openNoteAfterImport: false,
  whichNotesToOpenAfterImport: 'first-imported-note',
  sanitizeTitles: false,
  importHereFormat: {
    name: 'Import Here',
    outputPathTemplate: '{{citekey}}.md',
    imageOutputPathTemplate: '',
    imageBaseNameTemplate: '',
  },
  aiApiKeyId: '',
  aiApiUrl: 'https://open.cherryin.net/v1/chat/completions',
  aiModel: 'qwen/qwen3-omni-30b-a3b-thinking(free)',
  aiMaxPages: 10,
  aiMaxText: 50000,
  aiSummaryAnchor: '%% AI Summary %%',
  autoSummarize: false,
  aiPrompt: `你是一位电力电子(Power Electronics)领域的资深研究员。请阅读附件摘要，为我（电气工程学生）生成一份专业的学术速读笔记。

【Markdown 语法硬性要求】
1. **公式规范**：所有数学符号/变量/公式必须用 LaTeX。
   - 行内：$V_{dc}$，$\eta$；独立：$$ P = UI $$
   - 禁止使用 unicode 字符表示数学含义。
2. **结构规范**：
   - 仅使用 **H3 (###)** 及以下的层级作为章节标题。
   - 列表项使用 markdown bullet points (-) 或 有序列表1. 。
   - 关键概念加粗 (**bold**)。

【自适应分析逻辑】
请先判断文章是 **研究论文 (Research Paper)** 还是 **综述/教程 (Review/Tutorial)**，并采用对应的分析模板：

---
**分支 A：如果是研究论文 (Research Paper)**
侧重具体的拓扑、控制或应用。请包含但不限于：

### 核心贡献 (Core Contribution)
- 一句话总结解决了什么痛点（Pain Point）。
- 明确是提出了新拓扑、新控制还是新调制，并总结技术路线。
- 提炼做出的创新和效果。

### 技术要点与方法 (Methodology)
- 电路结构或控制环路特点。
- **关键参数提取**：列出 $V_{in}/V_{out}$、$P_{rated}$、$f_{sw}$、$\eta$、器件类型(SiC/GaN)等。

### 创新与对比 (Innovation & Comparison)
- 相比 SoA 方案的具体提升（效率/密度/成本）。

### 初步评价 (Critical Review)
- 亮点（如波形干净、思路巧妙）或局限性。

---
**分支 B：如果是综述或教程 (Review/Survey/Tutorial)**
侧重技术总结和趋势。请包含但不限于：

### 综述范围 (Scope & Background)
- 文章涵盖了哪类技术（如 "MMC 拓扑综述" 或 "宽禁带器件驱动综述"）。
- 总结的时间跨度和技术维度。

### 分类体系 (Classification Taxonomy)
- **(核心)** 文章是如何对现有技术进行分类的？（例如：按电平数分类、按隔离方式分类）。请清晰地梳理其分类逻辑。

### 主流路线对比 (Comparison of Methodologies)
- 总结不同技术路线的优缺点对比（最好能总结出 tradeoff 关系，如：成本 vs 性能）。

### 挑战与趋势 (Challenges & Future Trends)
- 领域内目前遗留的难点是什么？
- 作者预测的未来发展方向。

---
请根据文章实际内容自动选择上述一种模板进行输出，保持专业、简洁（简体中文）。`,
};

async function fixPath() {
  if (process.platform === 'win32') {
    return;
  }

  try {
    const path = await shellPath();

    process.env.PATH =
      path ||
      [
        './node_modules/.bin',
        '/.nodebrew/current/bin',
        '/usr/local/bin',
        process.env.PATH,
      ].join(':');
  } catch (e) {
    console.error(e);
  }
}

export default class ZoteroConnector extends Plugin {
  settings: ZoteroConnectorSettings;
  emitter: Events;
  fuse: Fuse<CiteKeyExport>;

  async onload() {
    await this.loadSettings();
    this.emitter = new Events();

    // Detect and set language based on Obsidian settings
    detectAndSetLanguage(this.app);

    this.updatePDFUtility();
    this.addSettingTab(new ZoteroConnectorSettingsTab(this.app, this));
    this.registerView(viewType, (leaf) => new DataExplorerView(this, leaf));

    this.settings.citeFormats.forEach((f) => {
      this.addFormatCommand(f);
    });

    this.settings.exportFormats.forEach((f) => {
      this.addExportCommand(f);
    });

    this.addCommand({
      id: 'zdc-insert-notes',
      name: t('commands.insertNotes'),
      editorCallback: (editor) => {
        const database = {
          database: this.settings.database,
          port: this.settings.port,
        };
        noteExportPrompt(
          database,
          this.app.workspace.getActiveFile()?.parent.path
        ).then((notes) => {
          if (notes) {
            insertNotesIntoCurrentDoc(editor, notes);
          }
        });
      },
    });

    this.addCommand({
      id: 'zdc-import-notes',
      name: t('commands.importNotes'),
      callback: () => {
        const database = {
          database: this.settings.database,
          port: this.settings.port,
        };
        noteExportPrompt(database, this.settings.noteImportFolder)
          .then((notes) => {
            if (notes) {
              return filesFromNotes(this.settings.noteImportFolder, notes);
            }
            return [] as string[];
          })
          .then((notes) => this.openNotes(notes));
      },
    });

    this.addCommand({
      id: 'zdc-import-notes-here',
      name: t('commands.importNotesHere'),
      callback: () => {
        const database = {
          database: this.settings.database,
          port: this.settings.port,
        };
        const activeFile = this.app.workspace.getActiveFile();
        const importFolder = activeFile ? activeFile.parent.path : '';
        const format = this.settings.importHereFormat;

        if (!format) {
          new Notice(t('notices.importHereNotConfigured'));
          return;
        }

        // Clone format and prepend import folder
        const localFormat = { ...format };
        // relative to importFolder.
        if (localFormat.outputPathTemplate) {
          localFormat.outputPathTemplate = importFolder.length > 0 ? importFolder + '/' + localFormat.outputPathTemplate : localFormat.outputPathTemplate;
        } else {
          localFormat.outputPathTemplate = importFolder + '/{{citekey}}.md';
        }

        if (localFormat.imageOutputPathTemplate) {
          localFormat.imageOutputPathTemplate = importFolder.length > 0 ? importFolder + '/' + localFormat.imageOutputPathTemplate : localFormat.imageOutputPathTemplate;
        }

        exportToMarkdown({
          settings: this.settings,
          database,
          exportFormat: localFormat,
        }).then((notes) => this.openNotes(notes));
      },
    });

    this.addCommand({
      id: 'show-zotero-debug-view',
      name: t('commands.dataExplorer'),
      callback: () => {
        this.activateDataExplorer();
      },
    });

    this.addCommand({
      id: 'zdc-update-library-note',
      name: t('commands.updateItemNote'),
      editorCallback: async (editor, view) => {
        const file = view.file;
        if (!file) {
          new Notice(t('notices.noActiveFile'));
          return;
        }

        // Use frontmatter directly if available, otherwise fallback to cache
        const citekey = (file.frontmatter || {}).citekey;
        if (!citekey) {
          new Notice(t('notices.noCitekeyInFrontmatter'));
          return;
        }

        const database = {
          database: this.settings.database,
          port: this.settings.port,
        };

        const format = this.settings.updateLibraryNoteFormat;

        if (!format) {
          new Notice(t('notices.updateLibraryNoteNotConfigured'));
          return;
        }

        const localFormat = { ...format };
        // Clean the path to ensure it is valid
        localFormat.outputPathTemplate = file.path;

        try {
          const library = await getLibForCiteKey(citekey, database);

          if (!library) {
            new Notice(t('notices.couldNotFindLibrary').replace('{{citekey}}', citekey));
            return;
          }

          await exportToMarkdown(
            {
              settings: this.settings,
              database,
              exportFormat: localFormat,
            },
            [{ key: citekey, library: library }]
          );

          new Notice(t('notices.updatedNote').replace('{{filename}}', file.basename));
        } catch (e) {
          console.error(e);
          new Notice(t('notices.failedToUpdateNote').replace('{{error}}', e.message));
        }
      },
    });

    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          this.emitter.trigger('fileUpdated', file);
        }
      })
    );

    this.addCommand({
      id: 'zdc-trigger-ai-summary',
      name: t('commands.triggerAiSummary'),
      callback: () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && activeFile instanceof TFile && activeFile.extension === 'md') {
          summarizePdf(this.app, activeFile, this.settings);
        } else {
          new Notice(t('notices.pleaseOpenMarkdownFile'));
        }
      },
    });

    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        if (file && file instanceof TFile && file.extension === 'md' && this.settings.autoSummarize) {
          summarizePdf(this.app, file, this.settings);
        }
      })
    );

    app.workspace.trigger('parse-style-settings');

    fixPath();
  }

  onunload() {
    this.settings.citeFormats.forEach((f) => {
      this.removeFormatCommand(f);
    });

    this.settings.exportFormats.forEach((f) => {
      this.removeExportCommand(f);
    });

    this.app.workspace.detachLeavesOfType(viewType);
  }

  addFormatCommand(format: CitationFormat) {
    this.addCommand({
      id: `${citationCommandIDPrefix}${format.name}`,
      name: format.name,
      editorCallback: (editor) => {
        const database = {
          database: this.settings.database,
          port: this.settings.port,
        };
        if (format.format === 'template' && format.template.trim()) {
          renderCiteTemplate({
            database,
            format,
          }).then((res) => {
            if (typeof res === 'string') {
              editor.replaceSelection(res);
            }
          });
        } else {
          getCAYW(format, database).then((res) => {
            if (typeof res === 'string') {
              editor.replaceSelection(res);
            }
          });
        }
      },
    });
  }

  removeFormatCommand(format: CitationFormat) {
    (this.app as any).commands.removeCommand(
      `${commandPrefix}${citationCommandIDPrefix}${format.name}`
    );
  }

  addExportCommand(format: ExportFormat) {
    this.addCommand({
      id: `${exportCommandIDPrefix}${format.name}`,
      name: format.name,
      callback: async () => {
        const database = {
          database: this.settings.database,
          port: this.settings.port,
        };
        this.openNotes(
          await exportToMarkdown({
            settings: this.settings,
            database,
            exportFormat: format,
          })
        );
      },
    });
  }

  removeExportCommand(format: ExportFormat) {
    (this.app as any).commands.removeCommand(
      `${commandPrefix}${exportCommandIDPrefix}${format.name}`
    );
  }

  async runImport(name: string, citekey: string, library: number = 1) {
    const format = this.settings.exportFormats.find((f) => f.name === name);

    if (!format) {
      throw new Error(`Error: Import format "${name}" not found`);
    }

    const database = {
      database: this.settings.database,
      port: this.settings.port,
    };

    if (citekey.startsWith('@')) citekey = citekey.substring(1);

    await exportToMarkdown(
      {
        settings: this.settings,
        database,
        exportFormat: format,
      },
      [{ key: citekey, library }]
    );
  }

  async openNotes(createdOrUpdatedMarkdownFilesPaths: string[]) {
    const pathOfNotesToOpen: string[] = [];
    if (this.settings.openNoteAfterImport) {
      // Depending on the choice, retreive the paths of the first, the last or all imported notes
      switch (this.settings.whichNotesToOpenAfterImport) {
        case 'first-imported-note': {
          pathOfNotesToOpen.push(createdOrUpdatedMarkdownFilesPaths[0]);
          break;
        }
        case 'last-imported-note': {
          pathOfNotesToOpen.push(
            createdOrUpdatedMarkdownFilesPaths[
            createdOrUpdatedMarkdownFilesPaths.length - 1
            ]
          );
          break;
        }
        case 'all-imported-notes': {
          pathOfNotesToOpen.push(...createdOrUpdatedMarkdownFilesPaths);
          break;
        }
      }
    }

    // Force a 1s delay after importing the files to make sure that notes are created before attempting to open them.
    // A better solution could surely be found to refresh the vault, but I am not sure how to proceed!
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const leaves = this.app.workspace.getLeavesOfType('markdown');
    for (const path of pathOfNotesToOpen) {
      const note = this.app.vault.getAbstractFileByPath(path);
      const open = leaves.find(
        (leaf) => (leaf.view as EditableFileView).file === note
      );
      if (open) {
        app.workspace.revealLeaf(open);
      } else if (note instanceof TFile) {
        await this.app.workspace.getLeaf(true).openFile(note);
      }
    }
  }

  async loadSettings() {
    const loadedSettings = await this.loadData();

    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loadedSettings,
    };
  }

  async saveSettings() {
    this.emitter.trigger('settingsUpdated');
    await this.saveData(this.settings);
  }

  deactivateDataExplorer() {
    this.app.workspace.detachLeavesOfType(viewType);
  }

  async activateDataExplorer() {
    this.deactivateDataExplorer();
    const leaf = this.app.workspace.createLeafBySplit(
      this.app.workspace.activeLeaf,
      'vertical'
    );

    await leaf.setViewState({
      type: viewType,
    });
  }

  async updatePDFUtility() {
    const { exeOverridePath, _exeInternalVersion, exeVersion } = this.settings;
    if (exeOverridePath || !exeVersion) return;

    if (
      exeVersion !== currentVersion ||
      !_exeInternalVersion ||
      _exeInternalVersion !== internalVersion
    ) {
      const modal = new LoadingModal(
        app,
        t('notices.updatingPdfUtility')
      );
      modal.open();

      try {
        const success = await downloadAndExtract();

        if (success) {
          this.settings.exeVersion = currentVersion;
          this.settings._exeInternalVersion = internalVersion;
          this.saveSettings();
        }
      } catch {
        //
      }

      modal.close();
    }
  }
}