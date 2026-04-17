import { App, Notice, PluginSettingTab, debounce } from 'obsidian';
import * as obsidian from 'obsidian';
import React from 'react';
import ReactDOM from 'react-dom';
import which from 'which';
import { useTranslation } from 'react-i18next';

import ZoteroConnector from '../main';
import {
  CitationFormat,
  ExportFormat,
  ZoteroConnectorSettings,
} from '../types';
import { AssetDownloader } from './AssetDownloader';
import { CiteFormatSettings } from './CiteFormatSettings';
import { ExportFormatSettings } from './ExportFormatSettings';
import { Icon } from './Icon';
import { SettingItem } from './SettingItem';
import { SettingGroup } from './SettingGroup';
import { useToggleSetting, useDebouncedArrayState } from './useSettings';

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

  // Use new hooks for better state management and UI responsiveness
  const {
    items: citeFormatState,
    updateItem: updateCiteState,
    addItem: addCiteItem,
    removeItem: removeCiteItem,
  } = useDebouncedArrayState(settings.citeFormats, updateCiteFormat, 300);

  const {
    items: exportFormatState,
    updateItem: updateExportState,
    addItem: addExportItem,
    removeItem: removeExportItem,
  } = useDebouncedArrayState(settings.exportFormats, updateExportFormat, 300);

  // Use unified toggle management
  const openNoteAfterImport = useToggleSetting(
    'openNoteAfterImport',
    updateSetting,
    !!settings.openNoteAfterImport
  );

  const pdfExportImageOCR = useToggleSetting(
    'pdfExportImageOCR',
    updateSetting,
    !!settings.pdfExportImageOCR
  );

  const shouldConcat = useToggleSetting(
    'shouldConcat',
    updateSetting,
    !!settings.shouldConcat
  );

  const autoSummarize = useToggleSetting(
    'autoSummarize',
    updateSetting,
    settings.autoSummarize
  );

  const sanitizeTitles = useToggleSetting(
    'sanitizeTitles',
    updateSetting,
    !!settings.sanitizeTitles
  );

  const [importHereFormatState, setImportHereFormatState] = React.useState(
    settings.importHereFormat || {
      name: 'Import Here',
      outputPathTemplate: '{{citekey}}.md',
      imageOutputPathTemplate: '',
      imageBaseNameTemplate: '',
    }
  );

  const updateImportHere = React.useCallback(
    (index: number, format: ExportFormat) => {
      updateSetting('importHereFormat', format);
      setImportHereFormatState(format);
    },
    [updateSetting]
  );

  // Improved citation format update - immediate UI update, debounced persistence
  const updateCite = React.useCallback(
    (index: number, format: CitationFormat) => {
      updateCiteState(index, format);
    },
    [updateCiteState]
  );

  const addCite = React.useCallback(() => {
    const newFormat = {
      name: `Format #${citeFormatState.length + 1}`,
      format: 'formatted-citation' as const,
    };
    addCiteItem(newFormat);
    addCiteFormat(newFormat);
  }, [addCiteFormat, addCiteItem, citeFormatState.length]);

  const removeCite = React.useCallback(
    (index: number) => {
      removeCiteItem(index);
      removeCiteFormat(index);
    },
    [removeCiteFormat, removeCiteItem]
  );

  // Improved export format update - immediate UI update, debounced persistence
  const updateExport = React.useCallback(
    (index: number, format: ExportFormat) => {
      updateExportState(index, format);
    },
    [updateExportState]
  );

  const addExport = React.useCallback(() => {
    const newFormat = {
      name: `Import #${exportFormatState.length + 1}`,
      outputPathTemplate: '{{citekey}}/',
      imageOutputPathTemplate: '{{citekey}}/',
      imageBaseNameTemplate: 'image',
    };
    addExportItem(newFormat);
    addExportFormat(newFormat);
  }, [addExportFormat, addExportItem, exportFormatState.length]);

  const removeExport = React.useCallback(
    (index: number) => {
      removeExportItem(index);
      removeExportFormat(index);
    },
    [removeExportFormat, removeExportItem]
  );

  const tessPathRef = React.useRef<HTMLInputElement>(null);
  const tessDataPathRef = React.useRef<HTMLInputElement>(null);

  const [useCustomPort, setUseCustomPort] = React.useState(
    settings.database === 'Custom'
  );

  return (
    <div>
      {/* ==================== CONNECTION & DATABASE SETTINGS ==================== */}
      <SettingItem name={t('settings.general.heading')} isHeading />
      
      <SettingGroup level={1}>
        {/* Database Selection */}
        <SettingItem
          name={t('settings.general.database.label')}
          description={t('settings.general.database.description')}
        >
          <select
            className="dropdown"
            defaultValue={settings.database}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
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

        {/* Custom Port (Nested under Database) */}
        {useCustomPort ? (
          <SettingGroup level={2}>
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
          </SettingGroup>
        ) : null}
      </SettingGroup>

      {/* ==================== IMPORT LOCATION & ASSET DOWNLOADER ==================== */}
      <SettingGroup level={1}>
        <SettingItem
          name={t('settings.general.noteImportLocation.label')}
          description={t('settings.general.noteImportLocation.description')}
        >
          <input
            onChange={(e) =>
              updateSetting(
                'noteImportFolder',
                (e.target as HTMLInputElement).value
              )
            }
            type="text"
            spellCheck={false}
            placeholder={t('settings.general.noteImportLocation.placeholder')}
            defaultValue={settings.noteImportFolder}
          />
        </SettingItem>

        {/* Asset Downloader nested under Import Location */}
        <SettingGroup level={2}>
          <AssetDownloader settings={settings} updateSetting={updateSetting} />
        </SettingGroup>
      </SettingGroup>

      {/* ==================== IMPORT BEHAVIOR ==================== */}
      <SettingGroup level={1}>
        <SettingItem
          name={t('settings.general.globalImportFilter.label')}
          description={t('settings.general.globalImportFilter.description')}
        >
          <div
            onClick={() => {
              sanitizeTitles.toggle();
            }}
            className={`checkbox-container${sanitizeTitles.isEnabled ? ' is-enabled' : ''
              }`}
          />
        </SettingItem>

        <SettingItem
          name={t('settings.general.openAfterImport.label')}
          description={t('settings.general.openAfterImport.description')}
        >
          <div
            onClick={openNoteAfterImport.toggle}
            className={`checkbox-container${openNoteAfterImport.isEnabled ? ' is-enabled' : ''
              }`}
          />
        </SettingItem>

        {/* Nested: Which notes to open (only when openAfterImport enabled) */}
        {openNoteAfterImport.isEnabled ? (
          <SettingGroup level={2}>
            <SettingItem
              name={t('settings.general.whichNotesToOpen.label')}
              description={t('settings.general.whichNotesToOpen.description')}
            >
              <select
                className="dropdown"
                defaultValue={settings.whichNotesToOpenAfterImport}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  updateSetting(
                    'whichNotesToOpenAfterImport',
                    (e.target as HTMLSelectElement).value
                  )
                }
              >
                <option value="first-imported-note">{t('settings.general.whichNotesToOpen.options.first')}</option>
                <option value="last-imported-note">{t('settings.general.whichNotesToOpen.options.last')}</option>
                <option value="all-imported-notes">{t('settings.general.whichNotesToOpen.options.all')}</option>
              </select>
            </SettingItem>
          </SettingGroup>
        ) : null}

        <SettingItem
          name={t('settings.general.annotationConcatenation.label')}
          description={t('settings.general.annotationConcatenation.description')}
        >
          <div
            onClick={shouldConcat.toggle}
            className={`checkbox-container${shouldConcat.isEnabled ? ' is-enabled' : ''}`}
          />
        </SettingItem>
      </SettingGroup>

      {/* ==================== CITATION FORMATS ==================== */}
      <SettingItem name={t('settings.citation.heading')} isHeading />
      <SettingGroup level={1}>
        <SettingItem>
          <button onClick={addCite} className="mod-cta">
            {t('settings.citation.addButton')}
          </button>
        </SettingItem>

        {citeFormatState.map((f, i) => {
          return (
            <SettingGroup level={2} key={i}>
              <CiteFormatSettings
                format={f}
                index={i}
                updateFormat={updateCite}
                removeFormat={removeCite}
              />
            </SettingGroup>
          );
        })}
      </SettingGroup>

      {/* ==================== AI SUMMARIZATION ==================== */}
      <SettingItem name={t('settings.ai.heading')} isHeading />
      <SettingGroup level={1}>
        <SettingItem
          name={t('settings.ai.autoTrigger.label')}
          description={t('settings.ai.autoTrigger.description')}
        >
          <div
            onClick={autoSummarize.toggle}
            className={`checkbox-container${autoSummarize.isEnabled ? ' is-enabled' : ''}`}
          />
        </SettingItem>

        {/* AI Configuration (only when auto-summarize enabled) */}
        {autoSummarize.isEnabled ? (
          <SettingGroup level={2}>
            <SettingItem
              name={t('settings.ai.apiKey.label')}
              description={t('settings.ai.apiKey.description')}
            >
              <div
                style={{ display: 'contents' }}
                ref={(el) => {
                  if (el && !el.hasChildNodes()) {
                    const SecretComponent = (obsidian as any).SecretComponent;
                    if (SecretComponent) {
                      const sc = new SecretComponent(app, el);
                      sc.setValue(settings.aiApiKeyId || "");
                      sc.onChange((id: string) => {
                        updateSetting('aiApiKeyId', id);
                      });
                    } else {
                      el.createSpan({ text: 'SecretStorage API not available. Please update Obsidian.' });
                    }
                  }
                }}
              />
            </SettingItem>

            <SettingItem
              name={t('settings.ai.apiUrl.label')}
              description={t('settings.ai.apiUrl.description')}
            >
              <input
                type="text"
                value={settings.aiApiUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting('aiApiUrl', (e.target as HTMLInputElement).value)}
              />
            </SettingItem>

            <SettingItem
              name={t('settings.ai.modelName.label')}
              description={t('settings.ai.modelName.description')}
            >
              <input
                type="text"
                value={settings.aiModel}
                placeholder={t('settings.ai.modelName.placeholder')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting('aiModel', (e.target as HTMLInputElement).value)}
              />
            </SettingItem>

            <SettingItem
              name={t('settings.ai.maxPages.label')}
              description={t('settings.ai.maxPages.description')}
            >
              <input
                type="number"
                value={settings.aiMaxPages}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting('aiMaxPages', Number((e.target as HTMLInputElement).value))}
              />
            </SettingItem>

            <SettingItem
              name={t('settings.ai.maxTextLength.label')}
              description={t('settings.ai.maxTextLength.description')}
            >
              <input
                type="number"
                value={settings.aiMaxText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting('aiMaxText', Number((e.target as HTMLInputElement).value))}
              />
            </SettingItem>

            <SettingItem
              name={t('settings.ai.triggerAnchor.label')}
              description={t('settings.ai.triggerAnchor.description')}
            >
              <input
                type="text"
                value={settings.aiSummaryAnchor}
                onChange={(e) => updateSetting('aiSummaryAnchor', (e.target as HTMLInputElement).value)}
              />
            </SettingItem>

            <SettingItem
              name={t('settings.ai.prompt.label')}
              description={t('settings.ai.prompt.description')}
            >
              <textarea
                rows={10}
                value={settings.aiPrompt}
                onChange={(e) => updateSetting('aiPrompt', (e.target as HTMLTextAreaElement).value)}
                style={{ width: '100%', fontFamily: 'monospace' }}
              />
            </SettingItem>
          </SettingGroup>
        ) : null}
      </SettingGroup>

      {/* ==================== IMPORT FORMATS ==================== */}
      <SettingItem name={t('settings.import.heading')} isHeading />
      <SettingGroup level={1}>
        <SettingItem name={t('settings.import.importHereSettings')} isHeading />
        
        <SettingGroup level={2}>
          <ExportFormatSettings
            format={importHereFormatState}
            index={-1}
            updateFormat={updateImportHere}
            removeFormat={() => { }}
          />
        </SettingGroup>

        <SettingItem name={t('settings.import.customImportFormats')} isHeading style={{ marginTop: '16px' }} />
        <SettingItem>
          <button onClick={addExport} className="mod-cta">
            {t('settings.import.addButton')}
          </button>
        </SettingItem>

        {exportFormatState.map((f, i) => {
          return (
            <SettingGroup level={2} key={exportFormatState.length - i}>
              <ExportFormatSettings
                format={f}
                index={i}
                updateFormat={updateExport}
                removeFormat={removeExport}
              />
            </SettingGroup>
          );
        })}
      </SettingGroup>

      {/* ==================== IMAGE PROCESSING & PDF UTILITIES ==================== */}
      <SettingItem
        name={t('settings.image.heading')}
        description={t('settings.image.description')}
        isHeading
      />
      <SettingGroup level={1}>
        {/* Basic Image Settings */}
        <SettingItem name={t('settings.image.format.label')}>
          <select
            className="dropdown"
            defaultValue={settings.pdfExportImageFormat}
            onChange={(e) =>
              updateSetting(
                'pdfExportImageFormat',
                (e.target as HTMLSelectElement).value
              )
            }
          >
            <option value="jpg">{t('settings.image.format.options.jpg')}</option>
            <option value="png">{t('settings.image.format.options.png')}</option>
          </select>
        </SettingItem>

        <SettingItem name={t('settings.image.quality.label')}>
          <input
            min="0"
            max="100"
            onChange={(e) =>
              updateSetting(
                'pdfExportImageQuality',
                Number((e.target as HTMLInputElement).value)
              )
            }
            type="number"
            defaultValue={settings.pdfExportImageQuality.toString()}
          />
        </SettingItem>

        <SettingItem name={t('settings.image.dpi.label')}>
          <input
            min="0"
            onChange={(e) =>
              updateSetting(
                'pdfExportImageDPI',
                Number((e.target as HTMLInputElement).value)
              )
            }
            type="number"
            defaultValue={settings.pdfExportImageDPI.toString()}
          />
        </SettingItem>

        {/* OCR Settings (nested under image processing) */}
        <SettingItem
          name={t('settings.image.ocr.label')}
          description={t('settings.image.ocr.description')}
        >
          <div
            onClick={pdfExportImageOCR.toggle}
            className={`checkbox-container${pdfExportImageOCR.isEnabled ? ' is-enabled' : ''}`}
          />
        </SettingItem>

        {/* OCR Configuration (only when OCR enabled) */}
        {pdfExportImageOCR.isEnabled ? (
          <SettingGroup level={2}>
            <SettingItem
              name={t('settings.image.tesseractPath.label')}
              description={t('settings.image.tesseractPath.description')}
            >
              <input
                ref={tessPathRef}
                onChange={(e) =>
                  updateSetting(
                    'pdfExportImageTesseractPath',
                    (e.target as HTMLInputElement).value
                  )
                }
                type="text"
                defaultValue={settings.pdfExportImageTesseractPath}
              />
              <div
                className="clickable-icon setting-editor-extra-setting-button"
                aria-label="Attempt to find tesseract automatically"
                onClick={async () => {
                  try {
                    const pathToTesseract = await which('tesseract');
                    if (pathToTesseract) {
                      tessPathRef.current.value = pathToTesseract;
                      updateSetting('pdfExportImageTesseractPath', pathToTesseract);
                    } else {
                      new Notice(
                        t('settings.messages.tesseractNotFound')
                      );
                    }
                  } catch (e) {
                    new Notice(
                      t('settings.messages.tesseractNotFound')
                    );
                    console.error(e);
                  }
                }}
              >
                <Icon name="magnifying-glass" />
              </div>
            </SettingItem>

            <SettingItem
              name={t('settings.image.ocrLanguage.label')}
              description={t('settings.image.ocrLanguage.description')}
            >
              <input
                onChange={(e) =>
                  updateSetting(
                    'pdfExportImageOCRLang',
                    (e.target as HTMLInputElement).value
                  )
                }
                type="text"
                defaultValue={settings.pdfExportImageOCRLang}
              />
            </SettingItem>

            <SettingItem
              name={t('settings.image.tesseractDataDir.label')}
              description={t('settings.image.tesseractDataDir.description')}
            >
              <input
                ref={tessDataPathRef}
                onChange={(e) =>
                  updateSetting(
                    'pdfExportImageTessDataDir',
                    (e.target as HTMLInputElement).value
                  )
                }
                type="text"
                defaultValue={settings.pdfExportImageTessDataDir}
              />
              <div
                className="clickable-icon setting-editor-extra-setting-button"
                aria-label="Select the tesseract data directory"
                onClick={() => {
                  const path = require('electron').remote.dialog.showOpenDialogSync({
                    properties: ['openDirectory'],
                  });

                  if (path && path.length) {
                    tessDataPathRef.current.value = path[0];
                    updateSetting('pdfExportImageTessDataDir', path[0]);
                  }
                }}
              >
                <Icon name="lucide-folder-open" />
              </div>
            </SettingItem>
          </SettingGroup>
        ) : null}
      </SettingGroup>
    </div>
  );
}

export class ZoteroConnectorSettingsTab extends PluginSettingTab {
  plugin: ZoteroConnector;
  dbTimer: number;

  constructor(app: App, plugin: ZoteroConnector) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    ReactDOM.render(
      <SettingsComponent
        app={this.app}
        settings={this.plugin.settings}
        addCiteFormat={this.addCiteFormat}
        updateCiteFormat={this.updateCiteFormat}
        removeCiteFormat={this.removeCiteFormat}
        addExportFormat={this.addExportFormat}
        updateExportFormat={this.updateExportFormat}
        removeExportFormat={this.removeExportFormat}
        updateSetting={this.updateSetting}
      />,
      this.containerEl
    );
  }

  addCiteFormat = (format: CitationFormat) => {
    this.plugin.addFormatCommand(format);
    this.plugin.settings.citeFormats.unshift(format);
    this.debouncedSave();

    return this.plugin.settings.citeFormats.slice();
  };

  updateCiteFormat = (index: number, format: CitationFormat) => {
    this.plugin.removeFormatCommand(this.plugin.settings.citeFormats[index]);
    this.plugin.addFormatCommand(format);
    this.plugin.settings.citeFormats[index] = format;
    this.debouncedSave();

    return this.plugin.settings.citeFormats.slice();
  };

  removeCiteFormat = (index: number) => {
    this.plugin.removeFormatCommand(this.plugin.settings.citeFormats[index]);
    this.plugin.settings.citeFormats.splice(index, 1);
    this.debouncedSave();

    return this.plugin.settings.citeFormats.slice();
  };

  addExportFormat = (format: ExportFormat) => {
    this.plugin.addExportCommand(format);
    this.plugin.settings.exportFormats.unshift(format);
    this.debouncedSave();

    return this.plugin.settings.exportFormats.slice();
  };

  updateExportFormat = (index: number, format: ExportFormat) => {
    this.plugin.removeExportCommand(this.plugin.settings.exportFormats[index]);
    this.plugin.addExportCommand(format);
    this.plugin.settings.exportFormats[index] = format;
    this.debouncedSave();

    return this.plugin.settings.exportFormats.slice();
  };

  removeExportFormat = (index: number) => {
    this.plugin.removeExportCommand(this.plugin.settings.exportFormats[index]);
    this.plugin.settings.exportFormats.splice(index, 1);
    this.debouncedSave();

    return this.plugin.settings.exportFormats.slice();
  };

  updateSetting = <T extends keyof ZoteroConnectorSettings>(
    key: T,
    value: ZoteroConnectorSettings[T]
  ) => {
    this.plugin.settings[key] = value;
    this.debouncedSave();
  };

  debouncedSave() {
    clearTimeout(this.dbTimer);
    this.dbTimer = activeWindow.setTimeout(() => {
      this.plugin.saveSettings();
    }, 150);
  }

  hide() {
    super.hide();
    ReactDOM.unmountComponentAtNode(this.containerEl);
  }
}
