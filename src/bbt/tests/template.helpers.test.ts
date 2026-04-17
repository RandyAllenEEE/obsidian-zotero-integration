/**
 * Tests for template.helpers.ts:
 * - getLastExport: ISO 8601 date parsing, legacy format, no-date fallback
 * - appendExportDate: date stamp format and position
 * - getExistingAnnotations: basic, no annotations, edge cases
 * - removeStartingSlash
 * - sanitizeObsidianPath
 */

jest.mock('obsidian', () => ({
  moment: require('moment'),
}), { virtual: true });

// Need to mock app for loadTemplate (but we won't call it in these tests)
global.app = {
  vault: {
    getAbstractFileByPath: jest.fn(),
    cachedRead: jest.fn(),
  },
} as any;

import { getLastExport, appendExportDate, getExistingAnnotations, removeStartingSlash, sanitizeObsidianPath } from '../template.helpers';
import moment from 'moment';

// ---------------------------------------------------------------------------
// getLastExport
// ---------------------------------------------------------------------------

describe('getLastExport', () => {
  it('parses ISO 8601 Import Date from end of file', () => {
    const md = 'Some content\n\n%% Import Date: 2024-06-15T10:30:00Z %%\n';
    const result = getLastExport(md);
    expect(result.isValid()).toBe(true);
    expect(result.format('YYYY-MM-DD')).toBe('2024-06-15');
  });

  it('parses Import Date with space-separated time (ISO date-only part is captured)', () => {
    // \S+ captures '2024-06-15' (up to first whitespace), moment('2024-06-15') is valid
    const md = 'Some content\n\n%% Import Date: 2024-06-15 10:30:00 %%\n';
    const result = getLastExport(md);
    expect(result.isValid()).toBe(true);
    expect(result.format('YYYY-MM-DD')).toBe('2024-06-15');
  });

  it('parses legacy Export Date format', () => {
    const md = 'Some content\n\n%% Export Date: 2024-06-15T10:30:00Z %%\n';
    const result = getLastExport(md);
    expect(result.isValid()).toBe(true);
    expect(result.format('YYYY-MM-DD')).toBe('2024-06-15');
  });

  it('returns invalid moment when no date stamp present', () => {
    const md = 'Some content with no date marker.';
    const result = getLastExport(md);
    expect(result.isValid()).toBe(false);
  });

  it('returns invalid moment for empty string', () => {
    const result = getLastExport('');
    expect(result.isValid()).toBe(false);
  });

  it('only matches date at end of file (not in middle content)', () => {
    // The regex has $ anchor — date not at very end should not match
    const md = '%% Import Date: 2024-01-01T00:00:00Z %% text-after';
    const result = getLastExport(md);
    expect(result.isValid()).toBe(false);
  });

  it('correctly identifies first import (invalid) vs subsequent (valid)', () => {
    const first = getLastExport('');
    const second = getLastExport('%% Import Date: 2024-06-15T10:30:00Z %%\n');
    expect(first.isValid()).toBe(false);
    expect(second.isValid()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// appendExportDate
// ---------------------------------------------------------------------------

describe('appendExportDate', () => {
  it('appends Import Date line at end of content', () => {
    const md = '# Note Title\nSome content';
    const result = appendExportDate(md);
    expect(result).toContain('%% Import Date:');
    expect(result.endsWith('%%\n')).toBe(true);
  });

  it('output contains valid ISO 8601 timestamp', () => {
    const result = appendExportDate('');
    const match = result.match(/%% Import Date: (.+) %%/);
    expect(match).not.toBeNull();
    const parsed = moment(match![1]);
    expect(parsed.isValid()).toBe(true);
  });

  it('can round-trip: getLastExport(appendExportDate("")) returns valid date', () => {
    const original = '# Title';
    const withDate = appendExportDate(original);
    const parsed = getLastExport(withDate);
    expect(parsed.isValid()).toBe(true);
    expect(parsed.valueOf()).not.toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getExistingAnnotations
// ---------------------------------------------------------------------------

describe('getExistingAnnotations', () => {
  it('extracts annotations between %% Begin/End markers', () => {
    const md = '## Notes\n%% Begin annotations %%\n- Highlighted text\n- Another note\n%% End annotations %%\n## More';
    const result = getExistingAnnotations(md);
    expect(result).toBe('- Highlighted text\n- Another note');
  });

  it('returns empty string when no annotation markers', () => {
    const md = 'No annotations here';
    expect(getExistingAnnotations(md)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(getExistingAnnotations('')).toBe('');
  });

  it('trims whitespace from extracted content', () => {
    const md = '%% Begin annotations %%\n  content  \n%% End annotations %%';
    expect(getExistingAnnotations(md)).toBe('content');
  });

  it('returns empty string if %% Begin but no %% End', () => {
    const md = '%% Begin annotations %%\ncontent without end';
    expect(getExistingAnnotations(md)).toBe('');
  });

  it('handles multiline annotation content', () => {
    const md = `%% Begin annotations %%
> "quoted text"
More annotation content
with multiple lines
%% End annotations %%`;
    const result = getExistingAnnotations(md);
    expect(result).toContain('"quoted text"');
    expect(result).toContain('More annotation content');
  });
});

// ---------------------------------------------------------------------------
// removeStartingSlash
// ---------------------------------------------------------------------------

describe('removeStartingSlash', () => {
  it('removes single leading slash', () => {
    expect(removeStartingSlash('/path/to/file')).toBe('path/to/file');
  });

  it('removes multiple leading slashes', () => {
    expect(removeStartingSlash('///path/to/file')).toBe('path/to/file');
  });

  it('leaves string without leading slash unchanged', () => {
    expect(removeStartingSlash('path/to/file')).toBe('path/to/file');
  });

  it('handles empty string', () => {
    expect(removeStartingSlash('')).toBe('');
  });

  it('handles just slashes', () => {
    expect(removeStartingSlash('/')).toBe('');
    expect(removeStartingSlash('//')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeObsidianPath
// ---------------------------------------------------------------------------

describe('sanitizeObsidianPath', () => {
  it('adds .md extension if missing', () => {
    expect(sanitizeObsidianPath('my-note')).toBe('my-note.md');
  });

  it('does not double-add .md extension', () => {
    expect(sanitizeObsidianPath('my-note.md')).toBe('my-note.md');
  });

  it('removes leading slash', () => {
    expect(sanitizeObsidianPath('/path/to/note')).toBe('path/to/note.md');
  });

  it('handles path with leading slash and no extension', () => {
    expect(sanitizeObsidianPath('/my-note')).toBe('my-note.md');
  });

  it('handles already correct path', () => {
    expect(sanitizeObsidianPath('folder/my-note.md')).toBe('folder/my-note.md');
  });
});
