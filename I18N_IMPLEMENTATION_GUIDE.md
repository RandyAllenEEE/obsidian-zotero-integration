/**
 * Obsidian-Zotero Settings Panel i18n Implementation Guide
 * 
 * This file demonstrates how to implement internationalization in the settings panel
 */

// ============================================================================
// Step 1: Install Dependencies
// ============================================================================
// yarn add i18next react-i18next

// ============================================================================
// Step 2: Create i18n configuration file
// ============================================================================
// File: src/i18n/config.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/index.json';
import zh from './locales/zh/index.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language - should be set from Obsidian locale
    interpolation: {
      escapeValue: false, // React handles XSS protection
    },
  });

export default i18n;

// ============================================================================
// Step 3: Create translation files
// ============================================================================
// File: src/i18n/locales/en/index.json

{
  "settings": {
    "general": {
      "heading": "General Settings",
      "database": {
        "label": "Database",
        "description": "Supports Zotero and Juris-M. Alternatively a custom port number can be specified.",
        "options": {
          "zotero": "Zotero",
          "jurisM": "Juris-M",
          "custom": "Custom"
        }
      },
      "portNumber": {
        "label": "Port number",
        "description": "If a custom port number has been set in Zotero, enter it here.",
        "placeholder": "Example: 23119"
      },
      "noteImportLocation": {
        "label": "Note Import Location",
        "description": "Notes imported from Zotero will be added to this folder in your vault",
        "placeholder": "Example: folder 1/folder 2"
      },
      "globalImportFilter": {
        "label": "Global Import Filter",
        "description": "Remove illegal characters (/, :, ?, *, <, >, |, \\) from Zotero item titles when using them as filenames."
      },
      "openAfterImport": {
        "label": "Open the created or updated note(s) after import",
        "description": "The created or updated markdown files resulting from the import will be automatically opened."
      },
      "whichNotesToOpen": {
        "label": "Which notes to open after import",
        "description": "Open either the first note imported, the last note imported, or all notes in new tabs.",
        "options": {
          "first": "First imported note",
          "last": "Last imported note",
          "all": "All imported notes"
        }
      },
      "annotationConcatenation": {
        "label": "Enable Annotation Concatenation",
        "description": "Annotations extracted from PDFs that begin with '+' will be appended to the previous annotation. Note: Annotation ordering is not always consistent and you may not always achieve the desired concatenation result"
      }
    },
    "citation": {
      "heading": "Citation Formats",
      "addButton": "Add Citation Format",
      "name": "Name",
      "outputFormat": "Output Format",
      "template": "Template",
      "bibliographyStyle": "Bibliography Style",
      "citationStyle": "Citation Style",
      "deleteButton": "Delete",
      "options": {
        "latex": "LaTeX",
        "biblatex": "BibLaTeX",
        "pandoc": "Pandoc",
        "formattedCitation": "Formatted Citation",
        "formattedBibliography": "Formatted Bibliography",
        "template": "Template"
      }
    },
    "ai": {
      "heading": "AI Summary Settings",
      "autoTrigger": {
        "label": "Auto-trigger AI Summary",
        "description": "Automatically trigger AI summary when opening a note with anchor and PDF link."
      },
      "apiKey": {
        "label": "API Key",
        "description": "OpenAI format API Key (Stored securely)"
      },
      "apiUrl": {
        "label": "API URL",
        "description": "Full API URL"
      },
      "modelName": {
        "label": "Model Name",
        "description": "e.g. gpt-4o or qwen-plus",
        "placeholder": "gpt-4o"
      },
      "maxPages": {
        "label": "Max Pages",
        "description": "Limit PDF reading to first N pages"
      },
      "maxTextLength": {
        "label": "Max Text Length",
        "description": "Max characters to extract"
      },
      "triggerAnchor": {
        "label": "Trigger Anchor",
        "description": "Text in note that triggers AI summary (must also have PDF link)"
      },
      "prompt": {
        "label": "AI Prompt",
        "description": "Customize the prompt sent to the AI model."
      }
    },
    "import": {
      "heading": "Import Formats & Import Here",
      "importHereSettings": "Import Here Settings",
      "customImportFormats": "Custom Import Formats",
      "addButton": "Add Import Format"
    },
    "image": {
      "heading": "Import Image Settings",
      "format": {
        "label": "Image Format",
        "options": {
          "jpg": "jpg",
          "png": "png"
        }
      },
      "quality": {
        "label": "Image Quality (jpg only)"
      },
      "dpi": {
        "label": "Image DPI"
      },
      "ocr": {
        "label": "Image OCR",
        "description": "Attempt to extract text from images created by rectangle annotations. This requires that tesseract be installed on your system."
      },
      "tesseractPath": {
        "label": "Tesseract path",
        "description": "Required: An absolute path to the tesseract executable."
      },
      "ocrLanguage": {
        "label": "Image OCR Language",
        "description": "Optional: defaults to english. Multiple languages can be specified like so: eng+deu. Each language must be installed on your system."
      },
      "tesseractDataDir": {
        "label": "Tesseract data directory",
        "description": "Optional: supply an absolute path to the directory where tesseract's language files reside."
      }
    },
    "pdf": {
      "heading": "PDF Utility",
      "description": "Extracting data from PDFs requires an external tool. This plugin will still work without it, but annotations will not be included in exports.",
      "upToDate": "PDF utility is up to date.",
      "pathOverride": {
        "label": "PDF Utility Path Override",
        "description": "Override the path to the PDF utility. Specify an absolute path to the pdfannots2json executable."
      }
    },
    "buttons": {
      "download": "Download",
      "browse": "Browse",
      "select": "Select",
      "delete": "Delete",
      "add": "Add"
    },
    "messages": {
      "downloading": "Downloading...",
      "downloadError": "Error downloading PDF utility. Check the console for more details.",
      "tesseractNotFound": "Unable to find tesseract on your system. If it is installed, please manually enter a path."
    }
  }
}

// ============================================================================
// File: src/i18n/locales/zh/index.json

{
  "settings": {
    "general": {
      "heading": "常规设置",
      "database": {
        "label": "数据库",
        "description": "支持Zotero和Juris-M，或指定自定义端口号。",
        "options": {
          "zotero": "Zotero",
          "jurisM": "Juris-M",
          "custom": "自定义"
        }
      },
      "portNumber": {
        "label": "端口号",
        "description": "如果在Zotero中设置了自定义端口号，请在此输入。",
        "placeholder": "例：23119"
      },
      "noteImportLocation": {
        "label": "笔记导入位置",
        "description": "从Zotero导入的笔记将添加到库中的此文件夹",
        "placeholder": "例：文件夹1/文件夹2"
      },
      "globalImportFilter": {
        "label": "全局导入过滤器",
        "description": "从Zotero项目标题中移除非法字符（/, :, ?, *, <, >, |, \\），用作文件名时。"
      },
      "openAfterImport": {
        "label": "导入后打开创建或更新的笔记",
        "description": "导入产生的已创建或已更新的markdown文件将自动打开。"
      },
      "whichNotesToOpen": {
        "label": "导入后打开哪些笔记",
        "description": "打开第一个导入的笔记、最后一个导入的笔记，或在新标签页中打开所有导入的笔记。",
        "options": {
          "first": "第一个导入的笔记",
          "last": "最后一个导入的笔记",
          "all": "所有导入的笔记"
        }
      },
      "annotationConcatenation": {
        "label": "启用注释串联",
        "description": "从PDF提取的以'+'开头的注释将附加到前一个注释。注意：注释顺序不总是一致的，您可能无法始终实现所需的串联结果"
      }
    },
    "citation": {
      "heading": "引用格式",
      "addButton": "添加引用格式",
      "name": "名称",
      "outputFormat": "输出格式",
      "template": "模板",
      "bibliographyStyle": "参考文献风格",
      "citationStyle": "引用风格",
      "deleteButton": "删除",
      "options": {
        "latex": "LaTeX",
        "biblatex": "BibLaTeX",
        "pandoc": "Pandoc",
        "formattedCitation": "格式化引用",
        "formattedBibliography": "格式化参考文献",
        "template": "模板"
      }
    },
    "ai": {
      "heading": "AI摘要设置",
      "autoTrigger": {
        "label": "自动触发AI摘要",
        "description": "打开带有锚点和PDF链接的笔记时自动触发AI摘要。"
      },
      "apiKey": {
        "label": "API密钥",
        "description": "OpenAI格式API密钥（安全存储）"
      },
      "apiUrl": {
        "label": "API URL",
        "description": "完整API URL"
      },
      "modelName": {
        "label": "模型名称",
        "description": "例 gpt-4o 或 qwen-plus",
        "placeholder": "gpt-4o"
      },
      "maxPages": {
        "label": "最大页数",
        "description": "限制PDF读取前N页"
      },
      "maxTextLength": {
        "label": "最大文本长度",
        "description": "最大提取字符数"
      },
      "triggerAnchor": {
        "label": "触发锚点",
        "description": "笔记中触发AI摘要的文本（还必须有PDF链接）"
      },
      "prompt": {
        "label": "AI提示词",
        "description": "自定义发送给AI模型的提示词。"
      }
    },
    "import": {
      "heading": "导入格式与导入到此处",
      "importHereSettings": "导入到此处设置",
      "customImportFormats": "自定义导入格式",
      "addButton": "添加导入格式"
    },
    "image": {
      "heading": "导入图像设置",
      "format": {
        "label": "图像格式",
        "options": {
          "jpg": "jpg",
          "png": "png"
        }
      },
      "quality": {
        "label": "图像质量（仅jpg）"
      },
      "dpi": {
        "label": "图像DPI"
      },
      "ocr": {
        "label": "图像OCR",
        "description": "尝试从矩形注释创建的图像中提取文本。这需要在系统上安装tesseract。"
      },
      "tesseractPath": {
        "label": "Tesseract路径",
        "description": "必需：tesseract可执行文件的绝对路径。"
      },
      "ocrLanguage": {
        "label": "图像OCR语言",
        "description": "可选：默认为英文。多种语言可按如下方式指定：eng+deu。每种语言都必须安装在系统上。"
      },
      "tesseractDataDir": {
        "label": "Tesseract数据目录",
        "description": "可选：提供tesseract语言文件所在目录的绝对路径。"
      }
    },
    "pdf": {
      "heading": "PDF工具",
      "description": "从PDF提取数据需要外部工具。此插件在没有它的情况下仍可工作，但导出中不包括注释。",
      "upToDate": "PDF工具是最新版本。",
      "pathOverride": {
        "label": "PDF工具路径覆盖",
        "description": "覆盖PDF工具的路径。指定pdfannots2json可执行文件的绝对路径。"
      }
    },
    "buttons": {
      "download": "下载",
      "browse": "浏览",
      "select": "选择",
      "delete": "删除",
      "add": "添加"
    },
    "messages": {
      "downloading": "正在下载...",
      "downloadError": "下载PDF工具出错。检查控制台获取更多详情。",
      "tesseractNotFound": "在您的系统上找不到tesseract。如果已安装，请手动输入路径。"
    }
  }
}

// ============================================================================
// Step 4: Updated settings.tsx with i18n
// ============================================================================
// File: src/settings/settings.tsx (modified section)

import { useTranslation } from 'react-i18next';

interface SettingsComponentProps {
  app: App;
  settings: ZoteroConnectorSettings;
  addCiteFormat: (format: CitationFormat) => CitationFormat[];
  updateCiteFormat: (index: number, format: CitationFormat) => CitationFormat[];
  removeCiteFormat: (index: number) => CitationFormat[];
  addExportFormat: (format: ExportFormat) => ExportFormat[];
  updateExportFormat: (index: number, format: ExportFormat) => ExportFormat[];
  removeExportFormat: (index: number) => ExportFormat[];
  updateSetting: (key: keyof ZoteroConnectorSettings, value: any) => void;
}

function SettingsComponent({
  app,
  settings,
  addCiteFormat,
  updateCiteFormat,
  removeCiteFormat,
  addExportFormat,
  updateExportFormat,
  removeExportFormat,
  updateSetting,
}: SettingsComponentProps) {
  const { t } = useTranslation();

  // ... existing state and callbacks ...

  return (
    <div>
      {/* Before: <SettingItem name="General Settings" isHeading /> */}
      {/* After: */}
      <SettingItem name={t('settings.general.heading')} isHeading />
      
      <AssetDownloader settings={settings} updateSetting={updateSetting} />
      
      <SettingItem
        name={t('settings.general.database.label')}
        description={t('settings.general.database.description')}
      >
        <select
          className="dropdown"
          defaultValue={settings.database}
          onChange={(e) => {
            const value = (e.target as HTMLSelectElement).value;
            updateSetting('database', value);
            if (value === 'Custom') {
              setUseCustomPort(true);
            } else {
              setUseCustomPort(false);
            }
          }}
        >
          <option value="Zotero">{t('settings.general.database.options.zotero')}</option>
          <option value="Juris-M">{t('settings.general.database.options.jurisM')}</option>
          <option value="Custom">{t('settings.general.database.options.custom')}</option>
        </select>
      </SettingItem>

      {useCustomPort ? (
        <SettingItem
          name={t('settings.general.portNumber.label')}
          description={t('settings.general.portNumber.description')}
        >
          <input
            onChange={(e) =>
              updateSetting('port', (e.target as HTMLInputElement).value)
            }
            type="number"
            placeholder={t('settings.general.portNumber.placeholder')}
            defaultValue={settings.port}
          />
        </SettingItem>
      ) : null}

      {/* Continue for all other settings... */}
    </div>
  );
}
