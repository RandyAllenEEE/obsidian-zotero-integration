import download from 'download';
import { Notice, debounce } from 'obsidian';
import os from 'os';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  checkEXEVersion,
  doesEXEExist,
  doesLegacyEXEExist,
  doesLegacyEXEExist2,
  getExeRoot,
  removeEXE,
  removeLegacyEXE,
  removeLegacyEXE2,
  scopeExe,
} from 'src/helpers';
import { ZoteroConnectorSettings } from 'src/types';

import { Icon } from './Icon';
import { SettingItem } from './SettingItem';
import { useDebouncedInput } from './useSettings';

export const currentVersion = '1.0.15';
export const internalVersion = 1;

const options: Record<string, Record<string, string>> = {
  darwin: {
    x64: `https://github.com/mgmeyers/pdfannots2json/releases/download/${currentVersion}/pdfannots2json.Mac.Intel.tar.gz`,
    arm64: `https://github.com/mgmeyers/pdfannots2json/releases/download/${currentVersion}/pdfannots2json.Mac.M1.tar.gz`,
  },
  linux: {
    x64: `https://github.com/mgmeyers/pdfannots2json/releases/download/${currentVersion}/pdfannots2json.Linux.x64.tar.gz`,
  },
  win32: {
    x64: `https://github.com/mgmeyers/pdfannots2json/releases/download/${currentVersion}/pdfannots2json.Windows.x64.zip`,
  },
};

function getDownloadUrl() {
  const platform = options[os.platform()];

  if (!platform) return null;

  const url = platform[os.arch()];

  if (!url) return null;

  return url;
}

export async function downloadAndExtract() {
  const url = getDownloadUrl();

  console.log('Obsidian Zotero Integration: Downloading ' + url);

  if (!url) return false;

  try {
    if (doesLegacyEXEExist2()) {
      removeLegacyEXE2();
    }

    if (doesLegacyEXEExist()) {
      removeLegacyEXE();
    }

    if (doesEXEExist()) {
      removeEXE();
    }

    await download(url, getExeRoot(), {
      extract: true,
    });

    scopeExe();
  } catch (e) {
    console.error(e);
    new Notice(
      'Error downloading PDF utility. Check the console for more details.',
      10000
    );
  }

  return true;
}

export function AssetDownloader(props: {
  settings: ZoteroConnectorSettings;
  updateSetting: (key: keyof ZoteroConnectorSettings, value: any) => void;
}) {
  const { t } = useTranslation();
  const [isUpToDate, setIsUpToDate] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [exists, setExists] = React.useState(false);

  // Use improved debounced input with immediate UI feedback
  const {
    value: overridePath,
    setValue: setOverridePathLocal,
    isDirty,
  } = useDebouncedInput(
    props.settings.exeOverridePath || '',
    (path: string) => {
      props.updateSetting('exeOverridePath', path);
    },
    500
  );

  React.useEffect(() => {
    const pathExists = doesEXEExist(overridePath);
    setExists(pathExists);

    if (pathExists) {
      checkEXEVersion(overridePath)
        .then((version) => {
          setIsUpToDate(`v${currentVersion}` === version);
        })
        .catch(() => {});
    }
  }, [overridePath]);

  const handleDownload = React.useCallback(() => {
    setIsLoading(true);

    downloadAndExtract().then((success) => {
      setIsLoading(false);

      if (success) {
        setIsUpToDate(true);
        setExists(true);
      }
    });
  }, []);

  const desc = t('settings.pdf.description');

  const overrideDesc = (
    <>
      {t('settings.pdf.pathOverride.description')}{' '}
      <a
        href="https://github.com/mgmeyers/pdfannots2json/releases"
        target="_blank"
        rel="noreferrer"
      >
        Download the executable here.
      </a>{' '}
      You may need to provide Obsidian the appropriate OS permissions to access
      the executable.
    </>
  );

  const Override = (
    <SettingItem
      name={t('settings.pdf.pathOverride.label')}
      description={overrideDesc}
    >
      <input
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverridePathLocal((e.target as HTMLInputElement).value)}
        type="text"
        spellCheck={false}
        value={overridePath}
      />
      <div
        className="clickable-icon setting-editor-extra-setting-button"
        aria-label="Select the pdfannots2json executable"
        onClick={() => {
          const path = require('electron').remote.dialog.showOpenDialogSync({
            properties: ['openFile'],
          });

          if (path && path.length) {
            setOverridePathLocal(path[0]);
          }
        }}
      >
        <Icon name="lucide-folder-open" />
      </div>
    </SettingItem>
  );

  if (exists && isUpToDate) {
    return (
      <>
        <SettingItem name={t('settings.pdf.heading')} description={desc}>
          <div className="zt-asset-success">
            <div className="zt-asset-success__icon">
              <Icon name="check-small" />
            </div>
            <div className="zt-asset-success__message">
              {t('settings.pdf.upToDate')}
            </div>
          </div>
        </SettingItem>
        {Override}
      </>
    );
  }

  const descFrag = (
    <>
      {desc}{' '}
      {exists && (
        <strong className="mod-warning">
          The PDF extraction tool requires updating. Please re-download.
        </strong>
      )}
      {!exists && !overridePath && (
        <strong>Click the button to download.</strong>
      )}
    </>
  );

  return (
    <>
      <SettingItem name={t('settings.pdf.heading')} description={descFrag}>
        {!overridePath && (
          <button disabled={isLoading} onClick={handleDownload}>
            {isLoading ? t('settings.messages.downloading') : t('settings.buttons.download')}
          </button>
        )}
      </SettingItem>
      {Override}
    </>
  );
}
