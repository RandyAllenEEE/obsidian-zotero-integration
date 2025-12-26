import { Notice, request } from 'obsidian';

import { getCurrentWindow } from '../helpers';
import { CitationFormat, DatabaseWithPort } from '../types';
import { LoadingModal } from './LoadingModal';
import { defaultHeaders, getPort } from './helpers';
import { getBibFromCiteKeys } from './jsonRPC';
import { ZQueue } from './queue';

export function getCiteKeyFromAny(item: any): CiteKey | null {
  if (!item.citekey && !item.citationKey) return null;

  return {
    key: item.citekey || item.citationKey,
    library: item.libraryID,
  };
}

let cachedIsRunning = false;
let lastCheck = 0;

export async function isZoteroRunning(
  database: DatabaseWithPort,
  silent?: boolean
) {
  if (cachedIsRunning && Date.now() - lastCheck < 1000 * 30) {
    return cachedIsRunning;
  }

  let modal: LoadingModal;
  if (!silent) {
    modal = new LoadingModal(app, 'Fetching data from Zotero...');
    modal.open();
  }
  const qid = Symbol();
  try {
    await ZQueue.wait(qid);
    const res = await request({
      method: 'GET',
      url: `http://127.0.0.1:${getPort(
        database.database,
        database.port
      )}/better-bibtex/cayw?probe=true`,
      headers: defaultHeaders,
    });

    modal?.close();
    cachedIsRunning = res === 'ready';
    lastCheck = Date.now();
    ZQueue.end(qid);
    return cachedIsRunning;
  } catch (e) {
    modal?.close();
    !silent &&
      new Notice(
        'Cannot connect to Zotero. Please ensure it is running and the Better BibTeX plugin is installed',
        10000
      );
    ZQueue.end(qid);
    return false;
  }
}

function getQueryParams(format: CitationFormat) {
  switch (format.format) {
    case 'formatted-bibliography':
      return 'format=formatted-bibliography';
    case 'formatted-citation':
      return `format=formatted-citation${format.cslStyle ? `&style=${format.cslStyle}` : ''
        }`;
    case 'pandoc':
      return `format=pandoc${format.brackets ? '&brackets=true' : ''}`;
    case 'latex':
      return `format=latex&command=${format.command || 'cite'}`;
    case 'biblatex':
      return `format=biblatex&command=${format.command || 'autocite'}`;
  }
}

export async function getCAYW(
  format: CitationFormat,
  database: DatabaseWithPort
) {
  const win = getCurrentWindow();
  if (!(await isZoteroRunning(database))) {
    return null;
  }

  const modal = new LoadingModal(app, 'Awaiting item selection from Zotero...');
  modal.open();

  const qid = Symbol();
  try {
    if (format.format === 'formatted-bibliography') {
      modal.close();
      const citeKeys = await getCiteKeys(database);
      return await getBibFromCiteKeys(citeKeys, database, format.cslStyle);
    }

    if (format.format === 'formatted-citation' && format.addZoteroLink) {
      // Step 1: Get JSON and Select items (Interactive)
      console.log('Zotero Link: Starting Double Call strategy. Format:', format);
      await ZQueue.wait(qid);
      const jsonRes = await request({
        method: 'GET',
        url: `http://127.0.0.1:${getPort(
          database.database,
          database.port
        )}/better-bibtex/cayw?format=json&select=true`,
        headers: defaultHeaders,
      });

      let citeKey = '';
      try {
        const items = JSON.parse(jsonRes);
        console.log('Zotero Link: JSON Response receive', items);
        if (Array.isArray(items) && items.length > 0) {
          const item = items[0];
          // Try to get the classic 8-char Zotero Item Key first (required for zotero://select links)
          // It's often nested in 'item.itemKey' or just 'itemKey' or can be parsed from 'uri'
          if (item.item?.itemKey) {
            citeKey = item.item.itemKey;
          } else if (item.itemKey) {
            citeKey = item.itemKey;
          } else {
            // Fallback: Try to use the standard helper (though this usually returns BBT key)
            const firstItem = getCiteKeyFromAny(item);
            if (firstItem) {
              citeKey = firstItem.key;
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse CAYW JSON response', e);
      }

      if (!citeKey) {
        console.warn('Zotero Link: No citekey found, aborting link generation.');
        modal.close();
        ZQueue.end(qid);
        return null;
      }

      // Step 2: Get Formatted Citation for SELECTED items (Background/Silent)
      // Note: We use 'selected=true' to use the selection established by the previous call
      const params = new URLSearchParams();
      params.append('format', 'formatted-citation');
      params.append('selected', 'true');
      if (format.cslStyle) {
        params.append('style', format.cslStyle);
      } else {
        console.warn('Zotero Link: format.cslStyle is missing! Zotero will use default style.');
      }

      const url2 = `http://127.0.0.1:${getPort(
        database.database,
        database.port
      )}/better-bibtex/cayw?${params.toString()}`;

      console.log('Zotero Link: Requesting citation text:', url2);

      const citationRes = await request({
        method: 'GET',
        url: url2,
        headers: defaultHeaders,
      });

      console.log('Zotero Link: Citation text received:', citationRes);

      win.show();
      modal.close();
      ZQueue.end(qid);

      if (citationRes) {
        return `[${citationRes}](zotero://select/library/items/${citeKey})`;
      }
      return null;
    }

    await ZQueue.wait(qid);

    // Legacy/Original Path: Ensure parameters are properly encoded
    const params = new URLSearchParams();

    switch (format.format) {
      case 'formatted-citation':
        params.append('format', 'formatted-citation');
        if (format.cslStyle) {
          params.append('style', format.cslStyle);
        }
        break;
      case 'pandoc':
        params.append('format', 'pandoc');
        if (format.brackets) {
          params.append('brackets', 'true');
        }
        break;
      case 'latex':
        params.append('format', 'latex');
        params.append('command', format.command || 'cite');
        break;
      case 'biblatex':
        params.append('format', 'biblatex');
        params.append('command', format.command || 'autocite');
        break;
    }

    const res = await request({
      method: 'GET',
      url: `http://127.0.0.1:${getPort(
        database.database,
        database.port
      )}/better-bibtex/cayw?${params.toString()}`,
      headers: defaultHeaders,
    });

    win.show();
    modal.close();
    ZQueue.end(qid);
    return res;
  } catch (e) {
    win.show();
    console.error(e);
    modal.close();
    new Notice(`Error processing citation: ${e.message}`, 10000);
    ZQueue.end(qid);
    return null;
  }
}

export interface CiteKey {
  key: string;
  library: number;
}

export async function getCiteKeys(
  database: DatabaseWithPort
): Promise<CiteKey[]> {
  try {
    const json = await getCAYWJSON(database);

    if (!json) return [];

    const citeKeys = json
      .map((e: any) => {
        return getCiteKeyFromAny(e);
      })
      .filter((e: any) => !!e);

    if (!citeKeys.length) {
      return [];
    }

    return citeKeys;
  } catch (e) {
    return [];
  }
}

export async function getCAYWJSON(database: DatabaseWithPort) {
  const win = getCurrentWindow();
  if (!(await isZoteroRunning(database))) {
    return null;
  }

  const modal = new LoadingModal(app, 'Awaiting item selection from Zotero...');
  modal.open();

  const qid = Symbol();
  try {
    await ZQueue.wait(qid);
    const res = await request({
      method: 'GET',
      url: `http://127.0.0.1:${getPort(
        database.database,
        database.port
      )}/better-bibtex/cayw?format=translate&translator=36a3b0b5-bad0-4a04-b79b-441c7cef77db&exportNotes=false`,
      headers: defaultHeaders,
    });

    win.show();

    modal.close();
    ZQueue.end(qid);
    if (res) {
      return JSON.parse(res).items || [];
    } else {
      return null;
    }
  } catch (e) {
    win.show();
    console.error(e);
    modal.close();
    new Notice(`Error retrieving cite key: ${e.message}`, 10000);
    ZQueue.end(qid);
    return null;
  }
}
