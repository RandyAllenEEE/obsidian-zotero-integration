## 4.1.1
- **AI Summary: Reliable frontmatter-based PDF path resolution** — PDF path is now stored in frontmatter (`zotero_pdf`) by the plugin on every import, replacing the previous regex-based body scan that required a specific template format. Works regardless of user's template configuration.
- **AI Summary: Auto-trigger on first import only** — AI summary is now triggered automatically only when a note is first imported (when `latest_import_time` frontmatter field is absent). Re-importing or re-opening the same note will not re-trigger, avoiding duplicate API calls.
- **AI Summary: Frontmatter-first PDF path detection** — `summarizePdf` now reads PDF path from `frontmatter.zotero_pdf` first, falling back to legacy regex scan only for backwards compatibility with manually written notes.
- **AI Summary: In-flight deduplication guard** — Added a module-level guard to prevent concurrent `summarizePdf` calls on the same file path.
- **Bug fix: PDF path normalization** — Fixed incorrect `file:///` prefix stripping that would strip too many slashes on Unix paths (e.g. `file:///home/user/test.pdf` was incorrectly becoming `home/user/test.pdf` instead of `/home/user/test.pdf`).
- **Settings: Added `updateLibraryNoteFormat` type** — Fixed missing `ExportFormat` type for `updateLibraryNoteFormat` setting field that was causing TypeScript errors.
- **Settings: Async `getSecret` support** — `getSecret` is now called with `await` first, falling back to sync call if it throws, supporting both older and newer Obsidian API versions.
- **Import: Plugin-managed frontmatter fields** — On every import (new or update), the plugin now automatically writes `citekey`, `latest_import_time`, and `zotero_pdf` to note frontmatter using Obsidian's official `processFrontMatter` API, ensuring these fields are always present regardless of user template configuration.
- **Maintenance: Test coverage** — Added unit tests for `ZoteroAutoSummarize` path normalization, `export-helpers` isFirstImport/PDF URL logic, `template.helpers` date parsing, and `useSettings` toggle/debounce hooks.

806bfbc Add "firstAttachmentLink" template data
f0f9f9c 3.2.0
1b43895 Support epub and snapshot annotations
125bf26 Merge pull request #344 from brchristian/patch-1
7f967e0 Merge pull request #349 from abachant/fix-import-format-settings-327
1fdb5a9 Merge pull request #248 from fguiotte/patch-1
2754d35 Fix spelling of 'Bibliography'
60ec333 Update PDF Annotations.md
1961cad Fix coloCategory Blue
d05ea31 Fix colorCategory Purple
