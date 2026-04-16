import React, { ChangeEvent } from 'react';
import { SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';
import { useTranslation } from 'react-i18next';

import { CitationFormat, Format } from '../types';
import { Icon } from './Icon';
import { cslListRaw } from './cslList';
import {
  NoOptionMessage,
  customSelectStyles,
  loadCSLOptions,
} from './select.helpers';

interface FormatSettingsProps {
  format: CitationFormat;
  index: number;
  removeFormat: (index: number) => void;
  updateFormat: (index: number, format: CitationFormat) => void;
}

export function CiteFormatSettings({
  format,
  index,
  updateFormat,
  removeFormat,
}: FormatSettingsProps) {
  const { t } = useTranslation();

  const defaultStyle = React.useMemo(() => {
    if (!format.cslStyle) return undefined;

    const match = cslListRaw.find((item) => item.value === format.cslStyle);

    if (match) return match;

    return { label: format.cslStyle, value: format.cslStyle };
  }, [format.cslStyle]);

  const onChangeName = React.useCallback(
    (e: ChangeEvent) => {
      updateFormat(index, {
        ...format,
        name: (e.target as HTMLInputElement).value,
      });
    },
    [updateFormat, index, format]
  );

  const onChangeFormat = React.useCallback(
    (e: ChangeEvent) => {
      const value = (e.target as HTMLSelectElement).value;
      const newFormat = {
        ...format,
        format: value as Format,
      };

      if (value === 'latex') {
        newFormat.command = 'cite';
      } else if (value === 'biblatex') {
        newFormat.command = 'autocite';
      } else if (newFormat.command) {
        delete newFormat.command;
      }

      if (newFormat.format !== 'template' && newFormat.template) {
        delete newFormat.template;
      }

      if (newFormat.format !== 'pandoc' && newFormat.brackets) {
        delete newFormat.brackets;
      }

      updateFormat(index, newFormat);
    },
    [updateFormat, index, format]
  );

  const onChangeTemplate = React.useCallback(
    (e: ChangeEvent) => {
      updateFormat(index, {
        ...format,
        template: (e.target as HTMLInputElement).value,
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

  const onChangeCommand = React.useCallback(
    (e: ChangeEvent) => {
      updateFormat(index, {
        ...format,
        command: (e.target as HTMLInputElement).value,
      });
    },
    [updateFormat, index, format]
  );

  const onChangeBrackets = React.useCallback(() => {
    updateFormat(index, {
      ...format,
      brackets: !format.brackets,
    });
  }, [updateFormat, index, format]);

  const onRemove = React.useCallback(() => {
    removeFormat(index);
  }, [removeFormat, index]);

  return (
    <div className="zt-format">
      <div className="zt-format__form">
        <div className="zt-format__label">{t('settings.citation.name')}</div>
        <div className="zt-format__input-wrapper">
          <input onChange={onChangeName} type="text" value={format.name} />
          <div className="zt-format__delete">
            <button className="zt-format__delete-btn" onClick={onRemove}>
              <Icon name="trash" />
            </button>
          </div>
        </div>
      </div>

      <div className="zt-format__form">
        <div className="zt-format__label">{t('settings.citation.outputFormat')}</div>
        <div className="zt-format__input-wrapper">
          <select
            className="dropdown"
            defaultValue={format.format}
            onChange={onChangeFormat}
          >
            <option value="latex">{t('settings.citation.options.latex')}</option>
            <option value="biblatex">{t('settings.citation.options.biblatex')}</option>
            <option value="pandoc">{t('settings.citation.options.pandoc')}</option>
            <option value="formatted-citation">{t('settings.citation.options.formattedCitation')}</option>
            <option value="formatted-bibliography">
              {t('settings.citation.options.formattedBibliography')}
            </option>
            <option value="template">{t('settings.citation.options.template')}</option>
          </select>
        </div>
      </div>

      {format.format === 'template' && (
        <div className="zt-format__form">
          <div className="zt-format__label">{t('settings.citation.template')}</div>
          <div className="zt-format__input-wrapper">
            <textarea
              rows={4}
              onChange={onChangeTemplate}
              value={format.template}
            />
          </div>
          <div className="zt-format__input-note">
            Citation templates have access to a subset of the Zotero item's
            data. The item's first attachement is available under the{' '}
            <pre>attachment</pre> key. Annotations are not provided. Open the
            data explorer from the command pallet to see available template
            data. Templates are written using{' '}
            <a
              href="https://mozilla.github.io/nunjucks/templating.html#variables"
              target="_blank"
              rel="noreferrer"
            >
              Nunjucks
            </a>
            .{' '}
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

      {['formatted-citation', 'formatted-bibliography', 'template'].contains(
        format.format
      ) && (
          <div className="zt-format__form">
            <div className="zt-format__label">
              {format.format === 'template'
                ? t('settings.citation.bibliographyStyle')
                : t('settings.citation.citationStyle')}
            </div>
            <div className="zt-format__input-wrapper">
              <AsyncSelect
                noOptionsMessage={NoOptionMessage}
                placeholder="Search..."
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
              Note, the chosen style must be installed in Zotero. See{' '}
              <a
                target="_blank"
                href="https://www.zotero.org/support/styles"
                rel="noreferrer"
              >
                Zotero: Citation Styles
              </a>
            </div>
          </div>
        )}

      {format.format === 'formatted-citation' && (
        <div className="zt-format__form">
          <div className="zt-format__label">Include Zotero Link</div>
          <div className="zt-format__input-wrapper">
            <div
              onClick={() => {
                updateFormat(index, {
                  ...format,
                  addZoteroLink: !format.addZoteroLink,
                });
              }}
              className={`checkbox-container${format.addZoteroLink ? ' is-enabled' : ''
                }`}
            />
          </div>
        </div>
      )}

      {['latex', 'biblatex'].contains(format.format) && (
        <div className="zt-format__form">
          <div className="zt-format__label">{t('settings.citation.command')}</div>
          <div className="zt-format__input-wrapper">
            <input
              type="text"
              value={format.command}
              onChange={onChangeCommand}
            />
          </div>
        </div>
      )}

      {format.format === 'pandoc' && (
        <div className="zt-format__form">
          <div className="zt-format__label">Include Brackets</div>
          <div className="zt-format__input-wrapper">
            <div
              onClick={onChangeBrackets}
              className={`checkbox-container${format.brackets ? ' is-enabled' : ''
                }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
