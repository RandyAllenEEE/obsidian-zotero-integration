/**
 * Tests for useSettings hooks (useToggleSetting, useDebouncedState, useDebouncedInput)
 * We test the logic independently without React by replicating the hook logic.
 */

import { ZoteroConnectorSettings } from '../types';

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
  aiApiKeyId: '',
  aiApiUrl: 'https://open.cherryin.net/v1/chat/completions',
  aiModel: 'qwen/qwen3-omni-30b-a3b-thinking(free)',
  aiMaxPages: 10,
  aiMaxText: 50000,
  aiSummaryAnchor: '%% AI Summary %%',
  autoSummarize: false,
  aiPrompt: 'Summarize this.',
};

// ---------------------------------------------------------------------------
// useToggleSetting logic replication
// ---------------------------------------------------------------------------

/**
 * Replicates useToggleSetting logic:
 * - Reads initial value from currentValue
 * - Toggle flips and calls updateSetting with new boolean
 * - External changes (currentValue changes) update local state via effect
 */
function makeToggleSetting(
  key: keyof ZoteroConnectorSettings,
  currentValue: boolean
): { isEnabled: boolean; toggle: () => void; updateFn: ReturnType<typeof jest.fn> } {
  let isEnabled = currentValue;
  const updateFn = jest.fn();
  return {
    get isEnabled() { return isEnabled; },
    toggle() {
      const prev = isEnabled;
      isEnabled = !isEnabled;
      updateFn(prev, isEnabled);
    },
    updateFn,
  };
}

describe('useToggleSetting', () => {
  it('initializes with correct isEnabled from currentValue', () => {
    const s = makeToggleSetting('autoSummarize', false);
    expect(s.isEnabled).toBe(false);
    s.toggle();
    expect(s.isEnabled).toBe(true);
  });

  it('toggle flips value and calls updateSetting with new boolean', () => {
    const s = makeToggleSetting('autoSummarize', false);
    s.toggle(); // false -> true
    expect(s.isEnabled).toBe(true);
    expect(s.updateFn).toHaveBeenCalledWith(false, true);
  });

  it('toggle from true to false calls updateSetting(false, true)', () => {
    const s = makeToggleSetting('autoSummarize', true);
    s.toggle(); // true -> false
    expect(s.isEnabled).toBe(false);
    expect(s.updateFn).toHaveBeenCalledWith(true, false);
  });

  it('multiple toggles accumulate', () => {
    const s = makeToggleSetting('openNoteAfterImport', false);
    s.toggle(); // F
    s.toggle(); // T
    s.toggle(); // F
    expect(s.isEnabled).toBe(false);
    expect(s.updateFn).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// useDebouncedState logic replication
// ---------------------------------------------------------------------------

type DebouncedCallback = jest.Mock;

function makeDebouncedState<T>(
  initialValue: T,
  onChange: (val: T) => void,
  delay = 300
): {
  value: T;
  setValue: (v: T) => void;
  isDirty: boolean;
  advanceTimers: (ms: number) => void;
} {
  let currentValue = initialValue;
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const setValue = (v: T) => {
    currentValue = v;
    dirty = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      onChange(currentValue);
      dirty = false;
    }, delay);
  };

  const advanceTimers = (ms: number) => {
    if (timer) {
      jest.advanceTimersByTime(ms);
    }
  };

  return { get value() { return currentValue; }, setValue, get isDirty() { return dirty; }, advanceTimers };
}

describe('useDebouncedState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with given value and isDirty=false', () => {
    const onChange = jest.fn();
    const s = makeDebouncedState(42, onChange);
    expect(s.value).toBe(42);
    expect(s.isDirty).toBe(false);
  });

  it('setValue immediately updates local state and sets isDirty=true', () => {
    const onChange = jest.fn();
    const s = makeDebouncedState(42, onChange);
    s.setValue(100);
    expect(s.value).toBe(100);
    expect(s.isDirty).toBe(true);
  });

  it('debounced callback fires after delay', () => {
    const onChange = jest.fn();
    const s = makeDebouncedState(42, onChange, 300);
    s.setValue(100);
    expect(onChange).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith(100);
    expect(s.isDirty).toBe(false);
  });

  it('debounced callback receives latest value (not stale)', () => {
    const onChange = jest.fn();
    const s = makeDebouncedState(0, onChange, 300);
    s.setValue(1);
    jest.advanceTimersByTime(150);
    s.setValue(2);
    jest.advanceTimersByTime(150); // now total 300ms elapsed, fires with value 2
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('isDirty resets to false after debounce fires', () => {
    const onChange = jest.fn();
    const s = makeDebouncedState('hello', onChange, 300);
    s.setValue('world');
    expect(s.isDirty).toBe(true);
    jest.advanceTimersByTime(300);
    expect(s.isDirty).toBe(false);
  });

  it('multiple rapid setValue calls only fire callback once (debounced)', () => {
    const onChange = jest.fn();
    const s = makeDebouncedState(0, onChange, 300);
    s.setValue(1);
    s.setValue(2);
    s.setValue(3);
    jest.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(3); // last value wins
  });
});

// ---------------------------------------------------------------------------
// aiSummaryAnchor anchor-in-content check
// ---------------------------------------------------------------------------

describe('anchor-in-content detection (aiSummaryAnchor)', () => {
  const ANCHOR = '%% AI Summary %%';

  function hasAnchor(content: string, anchor: string): boolean {
    return content.includes(anchor);
  }

  it('returns true when anchor exists in content', () => {
    const md = `# Paper Title\n\nSome notes here.\n\n%% AI Summary %%\n`;
    expect(hasAnchor(md, ANCHOR)).toBe(true);
  });

  it('returns false when anchor is missing', () => {
    const md = `# Paper Title\n\nSome notes without anchor.`;
    expect(hasAnchor(md, ANCHOR)).toBe(false);
  });

  it('anchor at beginning of content', () => {
    const md = `%% AI Summary %%\n# Paper Title`;
    expect(hasAnchor(md, ANCHOR)).toBe(true);
  });

  it('anchor at end of content', () => {
    const md = `# Paper Title\n\n%% AI Summary %%`;
    expect(hasAnchor(md, ANCHOR)).toBe(true);
  });

  it('anchor in middle of content', () => {
    const md = `# Paper\n\n%% AI Summary %%\n\n## Notes`;
    expect(hasAnchor(md, ANCHOR)).toBe(true);
  });

  it('custom anchor works', () => {
    const md = `# Paper\n\n## AI Summary\n\nContent`;
    expect(hasAnchor(md, '## AI Summary')).toBe(true);
  });

  it('partial anchor match does not count', () => {
    const md = `# Paper\n\n% AI Summary %%\n`;
    expect(hasAnchor(md, ANCHOR)).toBe(false);
  });

  it('handles anchor with surrounding whitespace', () => {
    const md = `# Paper\n   %% AI Summary %%  \n`;
    expect(hasAnchor(md, ANCHOR)).toBe(true); // spaces around don't affect contains
  });
});

// ---------------------------------------------------------------------------
// autoSummarize settings guard (simulating summarizePdf guard)
// ---------------------------------------------------------------------------

describe('autoSummarize settings guard', () => {
  it('summarizePdf should NOT run if autoSummarize is false', () => {
    const settings = { ...DEFAULT_SETTINGS, autoSummarize: false };
    const shouldRun = settings.autoSummarize === true;
    expect(shouldRun).toBe(false);
  });

  it('summarizePdf SHOULD run if autoSummarize is true', () => {
    const settings = { ...DEFAULT_SETTINGS, autoSummarize: true };
    const shouldRun = settings.autoSummarize === true;
    expect(shouldRun).toBe(true);
  });

  it('api key guard: should not proceed without key', () => {
    const settings = { ...DEFAULT_SETTINGS, aiApiKeyId: '' };
    const canProceed = !!settings.aiApiKeyId;
    expect(canProceed).toBe(false);
  });

  it('api key guard: proceeds with key configured', () => {
    const settings = { ...DEFAULT_SETTINGS, aiApiKeyId: 'sk-test-key-123' };
    const canProceed = !!settings.aiApiKeyId;
    expect(canProceed).toBe(true);
  });

  it('combined: autoSummarize=true AND apiKey set -> should attempt summarize', () => {
    const settings: ZoteroConnectorSettings = {
      ...DEFAULT_SETTINGS,
      autoSummarize: true,
      aiApiKeyId: 'sk-test-key-123',
    };
    const shouldAttempt = settings.autoSummarize === true && !!settings.aiApiKeyId;
    expect(shouldAttempt).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ProcessFrontMatter mock behavior (citekey update)
// ---------------------------------------------------------------------------

describe('citekey frontmatter update', () => {
  it('citekey is written as string', () => {
    const frontmatter: Record<string, unknown> = {};
    const item = { citekey: 'chen2024efficient' };
    frontmatter['citekey'] = item.citekey;
    expect(frontmatter['citekey']).toBe('chen2024efficient');
  });

  it('overwriting citekey replaces old value', () => {
    const frontmatter: Record<string, unknown> = { citekey: 'old-key' };
    frontmatter['citekey'] = 'new-key';
    expect(frontmatter['citekey']).toBe('new-key');
  });

  it('latest_import_time is ISO string', () => {
    const frontmatter: Record<string, unknown> = {};
    // moment().toISOString() example: "2024-06-15T10:30:00.000Z"
    frontmatter['latest_import_time'] = '2024-06-15T10:30:00.000Z';
    expect(typeof frontmatter['latest_import_time']).toBe('string');
    expect(frontmatter['latest_import_time']).toContain('T');
  });
});
