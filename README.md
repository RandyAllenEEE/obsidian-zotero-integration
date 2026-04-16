# Zotero Integration for Obsidian

A powerful integration plugin that seamlessly connects Zotero with Obsidian, allowing you to manage citations, bibliographies, notes, and PDF annotations directly within your Obsidian vault.

## Features

### Core Functionality
- **Citation Insertion**: Insert formatted citations from Zotero directly into your notes
- **Bibliography Generation**: Generate complete bibliographies with customizable CSL styles
- **Note Import**: Import Zotero notes and annotations into your Obsidian vault
- **PDF Annotations**: Extract highlights and annotations from PDFs in your Zotero library
- **Template System**: Customize output formats using Nunjucks templates

### Advanced Features
- **AI-Powered Summaries**: Automatic PDF summarization using AI models (compatible with OpenAI API)
- **Linkable Citations**: Clickable citations that open corresponding Zotero entries
- **Library Note Updates**: Update existing notes from Zotero based on citekeys in frontmatter
- **Image Extraction**: Extract rectangle annotations from PDFs as images
- **OCR Support**: Optional OCR processing for extracted images

## Prerequisites

- **Zotero** with the Better BibTeX plugin installed
- **Better BibTeX** configured with Quick Copy set to BibLaTeX format
- **Obsidian** version 1.11.4 or higher

## Installation

1. Install the plugin from the Obsidian community plugins marketplace
2. Install and enable Better BibTeX plugin in Zotero
3. Configure Better BibTeX with your preferred Quick Copy format
4. Restart Obsidian

## Setup

### Basic Configuration

1. Open Obsidian Settings → Zotero Integration
2. Select your database (Zotero or Juris-M)
3. If using a custom port in Zotero, enter it in the "Port number" field
4. Set your preferred note import location

### AI Summary Configuration (Optional)

1. Obtain an API key from your preferred OpenAI-compatible service
2. Enter your API URL and model name in the AI Summary Settings section
3. Customize the AI prompt to suit your needs

## Usage

### Commands Available

Access these via the Command Palette (Ctrl/Cmd+P):

- **Insert notes into current document**: Insert Zotero notes into the current document
- **Import notes**: Import Zotero notes into your vault
- **Import Here**: Import notes to the current folder
- **Update Item Note**: Update existing note from Zotero using citekey in frontmatter
- **Trigger AI Summary**: Generate AI summary for the current markdown file
- **Data explorer**: Explore Zotero data in a dedicated view

### Citation Formats

Create custom citation formats in the settings:

1. Click "Add Citation Format"
2. Provide a name for the format
3. Select output format (LaTeX, BibLaTeX, Pandoc, etc.)
4. Choose bibliography style (CSL)

### Export Formats

Define custom export formats for note imports:

1. Click "Add Export Format"
2. Name your format
3. Define the output path template
4. Configure the template content

## Internationalization

The plugin supports both English and Chinese interfaces. The language will automatically match your Obsidian application language setting.

## Troubleshooting

### Common Issues

- **Connection Error**: Verify Zotero is running and Better BibTeX is enabled
- **Empty Results**: Check that Better BibTeX Quick Copy is configured
- **Citation Not Found**: Ensure citekey exists in your Zotero library

### Getting Help

If you encounter issues:

1. Check that Zotero and Better BibTeX are properly installed and configured
2. Verify that the correct port is specified in settings
3. Ensure your Zotero application is running
4. Consult the console for error messages (Ctrl+Shift+I)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Support

If you find this plugin helpful, consider starring the repository or contributing to its development.