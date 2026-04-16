import React from 'react';
import { SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';
import { useTranslation } from 'react-i18next';

import { ExportFormat } from '../types';
import { Icon } from './Icon';
import { cslListRaw } from './cslList';
import {
  NoFileOptionMessage,
  NoOptionMessage,
  buildFileSearch,
  buildLoadFileOptions,
  customSelectStyles,
  loadCSLOptions,
} from './select.helpers';

interface FormatSettingsProps {
  format: ExportFormat;
  index: number;
  removeFormat: (index: number) => void;
  updateFormat: (index: number, format: ExportFormat) => void;
}

export function ExportFormatSettings({
  format,
  index,
  updateFormat,
  removeFormat,
}: FormatSettingsProps) {
  const { t } = useTranslation();

  const loadFileOptions = React.useMemo(() => {
    const fileSearch = buildFileSearch();
    return buildLoadFileOptions(fileSearch);
  }, []);

  const defaultTemplate = React.useMemo(() => {
    if (!format.templatePath) return undefined;

    const file = app.vault
      .getMarkdownFiles()
      .find((item) => item.path === format.templatePath);
    return file ? { value: file.path, label: file.path } : undefined;
  }, [format.templatePath]);

  const defaultStyle = React.useMemo(() => {
    if (!format.cslStyle) return undefined;

    const match = cslListRaw.find((item) => item.value === format.cslStyle);

    if (match) return match;

    return { label: format.cslStyle, value: format.cslStyle };
  }, [format.cslStyle]);

  const onChangeStr = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const key = (e.target as HTMLInputElement).dataset
        .key as keyof ExportFormat;
      updateFormat(index, {
        ...format,
        [key]: (e.target as HTMLInputElement).value,
      });
    },
    [updateFormat, index, format]
  );

  const onChangeCSLStyle = React.useCallback(
    (e: SingleValue<{ value: string; label: string }>) => {
      updateFormat(index, {
        ...format,
        cslStyle: e?.value,
      });
    },
    [updateFormat, index, format]
  );

  const onChangeTemplatePath = React.useCallback(
    (e: SingleValue<{ value: string; label: string }>) => {
      updateFormat(index, {
        ...format,
        templatePath: e?.value,
      });
    },
    [updateFormat, index, format]
  );

  const onRemove = React.useCallback(() => {
    removeFormat(index);
  }, [removeFormat, index]);

  return (
    <div className="zt-format">
      <div className="zt-format__form">
        <div className="zt-format__label">{t('settings.import.name')}</div>
        <div className="zt-format__input-wrapper">
          <input
            onChange={onChangeStr}
            type="text"
            data-key="name"
            value={format.name}
          />
          <div className="zt-format__delete">
            <button className="zt-format__delete-btn" onClick={onRemove}>
              <Icon name="trash" />
            </button>
          </div>
        </div>
      </div>

      <div className="zt-format__form">
        <div className="zt-format__label">{t('settings.import.outputPath')}</div>
        <div className="zt-format__input-wrapper">
          <input
            onChange={onChangeStr}
            type="text"
            data-key="outputPathTemplate"
            value={format.outputPathTemplate}
          />
        </div>
        <div className="zt-format__input-note">
          {t('settings.import.outputPathDescription')}
        </div>
      </div>

      <div className="zt-format__form">
        <div className="zt-format__label">{t('settings.import.imageOutputPath')}</div>
        <div className="zt-format__input-wrapper">
          <input
            onChange={onChangeStr}
            type="text"
            data-key="imageOutputPathTemplate"
            value={format.imageOutputPathTemplate}
          />
        </div>
        <div className="zt-format__input-note">
          {t('settings.import.imageOutputPathDescription')}
        </div>
      </div>

      <div className="zt-format__form">
        <div className="zt-format__label">{t('settings.import.imageBaseName')}</div>
        <div className="zt-format__input-wrapper">
          <input
            onChange={onChangeStr}
            type="text"
            data-key="imageBaseNameTemplate"
            value={format.imageBaseNameTemplate}
          />
        </div>
        <div className="zt-format__input-note">
          {t('settings.import.imageBaseNameDescription')}
        </div>
      </div>

      <div className="zt-format__form">
        <div className="zt-format__label">{t('settings.import.templateFile')}</div>
        <div className="zt-format__input-wrapper">
          <AsyncSelect
            noOptionsMessage={NoFileOptionMessage}
            placeholder={t('settings.import.templateFilePlaceholder')}
            cacheOptions
            defaultValue={defaultTemplate}
            className="zt-multiselect"
            loadOptions={loadFileOptions}
            onChange={onChangeTemplatePath}
            styles={customSelectStyles}
          />
        </div>
      </div>

      {format.headerTemplatePath && (
        <div className="zt-format__form is-deprecated">
          <div className="zt-format__label">
            Header Template File (deprecated)
          </div>
          <div className="zt-format__input-wrapper">
            <input type="text" disabled value={format.headerTemplatePath} />
            <button
              className="mod-warning"
              onClick={() => {
                updateFormat(index, {
                  ...format,
                  headerTemplatePath: undefined,
                });
              }}
            >
              Remove Template
            </button>
          </div>
          <div className="zt-format__input-note">
            Deprecated: Separate template files are no longer needed.{' '}
            <a
              href="https://github.com/mgmeyers/obsidian-zotero-integration/blob/main/docs/Templating.md"
              target="_blank"
              rel="noreferrer"
            >
              See the templating documentation here
            </a>
            .
          </div>
        </div>
      )}

      {format.annotationTemplatePath && (
        <div className="zt-format__form is-deprecated">
          <div className="zt-format__label">
            Annotation Template File (deprecated)
          </div>
          <div className="zt-format__input-wrapper">
            <input type="text" disabled value={format.annotationTemplatePath} />
            <button
              className="mod-warning"
              onClick={() => {
                updateFormat(index, {
                  ...format,
                  annotationTemplatePath: undefined,
                });
              }}
            >
              Remove Template
            </button>
          </div>
          <div className="zt-format__input-note">
            Deprecated: Separate template files are no longer needed.{' '}
            <a
              href="https://github.com/mgmeyers/obsidian-zotero-integration/blob/main/docs/Templating.md"
              target="_blank"
              rel="noreferrer"
            >
              See the templating documentation here
            </a>
            .
          </div>
        </div>
      )}

      {format.footerTemplatePath && (
        <div className="zt-format__form is-deprecated">
          <div className="zt-format__label">
            Footer Template File (deprecated)
          </div>
          <div className="zt-format__input-wrapper">
            <input type="text" disabled value={format.footerTemplatePath} />
            <button
              className="mod-warning"
              onClick={() => {
                updateFormat(index, {
                  ...format,
                  footerTemplatePath: undefined,
                });
              }}
            >
              Remove Template
            </button>
          </div>
          <div className="zt-format__input-note">
            Deprecated: Separate template files are no longer needed.{' '}
            <a
              href="https://github.com/mgmeyers/obsidian-zotero-integration/blob/main/docs/Templating.md"
              target="_blank"
              rel="noreferrer"
            >
              See the templating documentation here
            </a>
            .
          </div>
        </div>
      )}

      <div className="zt-format__form">
        <div className="zt-format__label">{t('settings.import.bibliographyStyle')}</div>
        <div className="zt-format__input-wrapper">
          <AsyncSelect
            noOptionsMessage={NoOptionMessage}
            placeholder={t('settings.import.bibliographyStylePlaceholder')}
            cacheOptions
            defaultValue={defaultStyle}
            className="zt-multiselect"
            loadOptions={loadCSLOptions}
            isClearable
            onChange={onChangeCSLStyle}
            styles={customSelectStyles}
          />
        </div>
        <div className="zt-format__input-note">
          {t('settings.import.bibliographyStyleDescription')}
        </div>
      </div>
    </div>
  );
}
