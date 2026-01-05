## Obsidian Zotero Integration

Insert and import citations, bibliographies, notes, and PDF annotations from Zotero into Obsidian. Requires the [Better BibTeX for Zotero](https://retorque.re/zotero-better-bibtex/installation/) plugin.

You can find the documentation for this plugin [here](https://github.com/mgmeyers/obsidian-zotero-integration/blob/main/docs/README.md). The documentation is currently incomplete. Please reach out if you'd like to help.

## New in v3.3.1: Linked Citations
- **Linked Citations**: Added an option to the "Formatted Citation" output format to wrap citations in a Zotero link.
    - When enabled, citations like `(Smith 2020)` become links that select the item in Zotero when clicked.
    - Seamless integration: uses a double-call strategy to ensure correct formatting and linking without extra popups.

## New in v3.3.0: AI Summary
This version introduces an AI-powered PDF summarization feature.
- **Trigger AI Summary**: Manually trigger summarization of local PDFs linked in your notes via the command palette.
- **Auto-trigger**: Optionally trigger summarization automatically when opening a note containing the configured anchor.
- **Customizable Prompt**: Tailor the AI prompt, model (OpenAI-compatible), and character limits in settings.
- **Foldable Settings**: Reorganized settings panel with collapsible sections for a cleaner interface.

## New in v3.3.1: Update Library Note
- **Contextual Update**: Use the "Update Library Note" command while on a Zotero-imported note to refresh its content from Zotero.
- **Smart Logic**: Automatically detects the `citekey` from frontmatter and updates the file in-place using your "Import Here" settings. No need to select the item in Zotero.

## Help, how do I install the plugin?

In Obsidian, open Settings, on the left under Options open Community Plugins, on Community Plugins select Browse and search for 'Zotero Integration'

## Help, the plugin doesn't load!

Please insure your Obsidian installer version is at least `v0.13.24`. If not, try reinstalling obsidian.

## Help, I get an error when creating a citation or bibliography!

Please ensure you have selected a quick copy style in Zotero:

<img src="https://raw.githubusercontent.com/mgmeyers/obsidian-zotero-integration/main/screenshots/04.png" alt="A screenshot Zotero's quick copy settings">

And that you can copy a citation in Zotero when and item is selected:

<img src="https://raw.githubusercontent.com/mgmeyers/obsidian-zotero-integration/main/screenshots/05.png" alt="A screenshot Zotero's edit menu showing the copy citation option">


## Screenshots

<img src="https://raw.githubusercontent.com/mgmeyers/obsidian-zotero-integration/main/screenshots/01.png" alt="A screenshot of this plugin's settings">

<img src="https://raw.githubusercontent.com/mgmeyers/obsidian-zotero-integration/main/screenshots/02.png" alt="A screenshot of available plugin commands">

<img src="https://raw.githubusercontent.com/mgmeyers/obsidian-zotero-integration/main/screenshots/03.png" alt="A screenshot of the Zotero search bar">

<img src="https://raw.githubusercontent.com/mgmeyers/obsidian-zotero-integration/main/screenshots/demo.gif" alt="A short gif demonstraiting importing notes form Zotero into the current file">
