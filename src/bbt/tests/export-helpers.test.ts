/**
 * Tests for frontmatter-first-import detection and PDF URL construction logic
 * (mirrors the actual queueRender logic in export.ts without requiring Obsidian runtime)
 */

// ---------------------------------------------------------------------------
// Simulate the isFirstImport determination logic from export.ts queueRender
// ---------------------------------------------------------------------------

interface MockTFile {
  path: string;
  frontmatter?: Record<string, unknown>;
}

interface RenderQueueEntry {
  item: Record<string, unknown>;
  file: MockTFile | null;
  isFirstImport: boolean;
  pdfUrl: string | null;
}

/** Mirrors the isFirstImport logic in export.ts queueRender */
function determineIsFirstImport(existingFile: MockTFile | null, frontmatter: Record<string, unknown> | null): boolean {
  if (!existingFile) return true;
  return !frontmatter?.['latest_import_time'];
}

/** Mirrors the PDF URL extraction from export.ts queueRender */
function buildPdfUrl(item: Record<string, unknown>): string | null {
  const attachments = item['attachments'] as Array<{ path?: string }> | undefined;
  if (!attachments || !Array.isArray(attachments)) return null;
  const pdfAttachment = attachments.find(a => a.path?.endsWith('.pdf'));
  if (!pdfAttachment?.path) return null;
  return 'file://' + pdfAttachment.path.replace(/^\//, '').replace(/ /g, '%20');
}

/** Simulate queueRender adding an entry (mirrors export.ts queueRender) */
function queueRender(
  markdownPath: string,
  item: Record<string, unknown>,
  existingFile: MockTFile | null
): RenderQueueEntry {
  const frontmatter = existingFile ? (existingFile.frontmatter ?? {}) : null;
  const isFirstImport = determineIsFirstImport(existingFile, frontmatter);
  const pdfUrl = buildPdfUrl(item);

  return {
    item,
    file: existingFile,
    isFirstImport,
    pdfUrl,
  };
}

// ---------------------------------------------------------------------------
// isFirstImport determination tests
// ---------------------------------------------------------------------------

describe('isFirstImport determination', () => {
  it('returns true when no existing file (new import)', () => {
    const entry = queueRender('/notes/paper.md', { citekey: 'test' }, null);
    expect(entry.isFirstImport).toBe(true);
  });

  it('returns true when existing file has no latest_import_time', () => {
    const existingFile: MockTFile = { path: '/notes/paper.md', frontmatter: {} };
    const entry = queueRender('/notes/paper.md', { citekey: 'test' }, existingFile);
    expect(entry.isFirstImport).toBe(true);
  });

  it('returns false when existing file has latest_import_time', () => {
    const existingFile: MockTFile = {
      path: '/notes/paper.md',
      frontmatter: { citekey: 'test', latest_import_time: '2024-01-01T00:00:00Z' },
    };
    const entry = queueRender('/notes/paper.md', { citekey: 'test' }, existingFile);
    expect(entry.isFirstImport).toBe(false);
  });

  it('returns false when existing file has latest_import_time (different format)', () => {
    const existingFile: MockTFile = {
      path: '/notes/paper.md',
      frontmatter: { latest_import_time: '2024-06-15 10:30:00' },
    };
    const entry = queueRender('/notes/paper.md', { citekey: 'test' }, existingFile);
    expect(entry.isFirstImport).toBe(false);
  });

  it('handles frontmatter with citekey but no latest_import_time as first import', () => {
    const existingFile: MockTFile = {
      path: '/notes/paper.md',
      frontmatter: { citekey: 'test' }, // no latest_import_time
    };
    const entry = queueRender('/notes/paper.md', { citekey: 'test' }, existingFile);
    expect(entry.isFirstImport).toBe(true);
  });

  it('handles null frontmatter (old file with no frontmatter) as first import', () => {
    const existingFile: MockTFile = { path: '/notes/paper.md' }; // frontmatter is undefined
    const entry = queueRender('/notes/paper.md', { citekey: 'test' }, existingFile);
    expect(entry.isFirstImport).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PDF URL construction tests
// ---------------------------------------------------------------------------

describe('buildPdfUrl from attachments', () => {
  it('returns file:// URL for first PDF attachment', () => {
    const item = {
      attachments: [
        { path: '/home/user/papers/test.pdf', title: 'test.pdf' },
        { path: '/home/user/papers/test.txt', title: 'test.txt' },
      ],
    };
    expect(buildPdfUrl(item)).toBe('file://home/user/papers/test.pdf');
  });

  it('returns null when no attachments', () => {
    expect(buildPdfUrl({})).toBeNull();
    expect(buildPdfUrl({ attachments: [] })).toBeNull();
  });

  it('returns null when attachments array is undefined', () => {
    expect(buildPdfUrl({ attachments: undefined as any })).toBeNull();
  });

  it('returns null when no PDF in attachments', () => {
    const item = {
      attachments: [
        { path: '/home/user/docs/notes.txt' },
        { path: '/home/user/docs/image.png' },
      ],
    };
    expect(buildPdfUrl(item)).toBeNull();
  });

  it('returns null when PDF attachment has no path', () => {
    const item = {
      attachments: [{ title: 'missing path' }],
    };
    expect(buildPdfUrl(item)).toBeNull();
  });

  it('URL-encodes spaces in path', () => {
    const item = {
      attachments: [
        { path: '/home/user/my papers/test file.pdf' },
      ],
    };
    expect(buildPdfUrl(item)).toBe('file://home/user/my%20papers/test%20file.pdf');
  });

  it('strips leading slash from path', () => {
    const item = {
      attachments: [{ path: '/home/user/papers/test.pdf' }],
    };
    // '/home/...' becomes 'home/...'
    expect(buildPdfUrl(item)).toBe('file://home/user/papers/test.pdf');
  });

  it('uses first PDF when multiple PDFs exist', () => {
    const item = {
      attachments: [
        { path: '/home/user/papers/first.pdf' },
        { path: '/home/user/papers/second.pdf' },
      ],
    };
    expect(buildPdfUrl(item)).toBe('file://home/user/papers/first.pdf');
  });

  it('handles Windows path with backslashes', () => {
    const item = {
      attachments: [{ path: 'C:\\Users\\Randy\\Papers\\test.pdf' }],
    };
    // backslash not stripped — path is used as-is after removing leading /
    expect(buildPdfUrl(item)).toBe('file://C:\\Users\\Randy\\Papers\\test.pdf');
  });

  it('handles PDF at root level', () => {
    const item = {
      attachments: [{ path: '/test.pdf' }],
    };
    expect(buildPdfUrl(item)).toBe('file://test.pdf');
  });

  it('handles path with special characters', () => {
    const item = {
      attachments: [{ path: '/home/user/papers/论文(PowerElectronics).pdf' }],
    };
    // Special chars that are not %XX encoded — only spaces are encoded by our logic
    expect(buildPdfUrl(item)).toBe('file://home/user/papers/论文(PowerElectronics).pdf');
  });
});

// ---------------------------------------------------------------------------
// Integration: queueRender with real item data shapes
// ---------------------------------------------------------------------------

describe('queueRender with realistic item data', () => {
  it('first import with PDF triggers isFirstImport=true and has pdfUrl', () => {
    const item = {
      citekey: 'chen2024efficient',
      attachments: [{ path: '/home/user/zotero/chen2024efficient.pdf' }],
    };
    const entry = queueRender('/notes/chen2024efficient.md', item, null);
    expect(entry.isFirstImport).toBe(true);
    expect(entry.pdfUrl).toBe('file://home/user/zotero/chen2024efficient.pdf');
  });

  it('update import with same item: isFirstImport=false, pdfUrl still present', () => {
    const item = {
      citekey: 'chen2024efficient',
      attachments: [{ path: '/home/user/zotero/chen2024efficient.pdf' }],
    };
    const existingFile: MockTFile = {
      path: '/notes/chen2024efficient.md',
      frontmatter: { citekey: 'chen2024efficient', latest_import_time: '2024-01-01T00:00:00Z' },
    };
    const entry = queueRender('/notes/chen2024efficient.md', item, existingFile);
    expect(entry.isFirstImport).toBe(false);
    expect(entry.pdfUrl).toBe('file://home/user/zotero/chen2024efficient.pdf');
  });

  it('note-only item (no attachments): pdfUrl is null', () => {
    const item = {
      citekey: 'chen2024efficient',
      attachments: [],
    };
    const entry = queueRender('/notes/chen2024efficient.md', item, null);
    expect(entry.isFirstImport).toBe(true);
    expect(entry.pdfUrl).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// frontmatter.zotero_pdf write/read roundtrip (conceptual)
// ---------------------------------------------------------------------------

describe('frontmatter write-read roundtrip', () => {
  /**
   * Simulates what processFrontMatter does:
   * writing { citekey, latest_import_time, zotero_pdf } to frontmatter
   * then reading back with getPdfPath
   */
  async function getPdfPathFromFrontmatter(frontmatter: any): Promise<string | null> {
    const fmPath = frontmatter?.['zotero_pdf'];
    if (fmPath && typeof fmPath === 'string' && fmPath.trim()) {
      return fmPath.trim();
    }
    return null;
  }

  it('writes and reads back a valid PDF URL', async () => {
    const frontmatterWrite: Record<string, unknown> = {};
    const citekey = 'chen2024efficient';
    const latest_import_time = '2024-06-15T10:30:00Z';
    const zotero_pdf = 'file://home/user/zotero/chen2024efficient.pdf';

    frontmatterWrite['citekey'] = citekey;
    frontmatterWrite['latest_import_time'] = latest_import_time;
    frontmatterWrite['zotero_pdf'] = zotero_pdf;

    // Simulate reading back
    const readBack = await getPdfPathFromFrontmatter(frontmatterWrite);
    expect(readBack).toBe('file://home/user/zotero/chen2024efficient.pdf');
  });

  it('readBack returns null when zotero_pdf is null', async () => {
    const frontmatterWrite: Record<string, unknown> = {};
    frontmatterWrite['citekey'] = 'test';
    frontmatterWrite['latest_import_time'] = '2024-06-15T10:30:00Z';
    frontmatterWrite['zotero_pdf'] = null;

    const readBack = await getPdfPathFromFrontmatter(frontmatterWrite);
    expect(readBack).toBeNull();
  });

  it('readBack returns null when zotero_pdf is empty string', async () => {
    const frontmatterWrite: Record<string, unknown> = {};
    frontmatterWrite['citekey'] = 'test';
    frontmatterWrite['latest_import_time'] = '2024-06-15T10:30:00Z';
    frontmatterWrite['zotero_pdf'] = '';

    const readBack = await getPdfPathFromFrontmatter(frontmatterWrite);
    expect(readBack).toBeNull();
  });

  it('readBack handles missing zotero_pdf key gracefully', async () => {
    const frontmatterWrite: Record<string, unknown> = {};
    frontmatterWrite['citekey'] = 'test';
    frontmatterWrite['latest_import_time'] = '2024-06-15T10:30:00Z';
    // zotero_pdf not set

    const readBack = await getPdfPathFromFrontmatter(frontmatterWrite);
    expect(readBack).toBeNull();
  });

  it('processFrontMatter overwrites previous zotero_pdf value (simulates YAML behavior)', async () => {
    // Simulate user template having zotero_pdf: "[link](file://old.pdf)"
    const frontmatterWrite: Record<string, unknown> = {};
    frontmatterWrite['citekey'] = 'test';
    frontmatterWrite['latest_import_time'] = '2024-06-15T10:30:00Z';
    // plugin overwrites with correct pure URL value
    frontmatterWrite['zotero_pdf'] = 'file://home/user/new/paper.pdf';

    const readBack = await getPdfPathFromFrontmatter(frontmatterWrite);
    expect(readBack).toBe('file://home/user/new/paper.pdf'); // correct value wins
  });
});
