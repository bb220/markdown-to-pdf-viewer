# Markdown Viewer & PDF Export

A local web server that renders `resume.md` with live-reloading and vector PDF export capabilities.

![markdown-to-pdf-demo - Made with Clipchamp](https://github.com/user-attachments/assets/4f8dd197-4999-49e4-9a94-0b1cbd86716e)

## Features

- **Live Reload**: Automatically updates the browser when you save changes to `resume.md`
- **PDF Export**: One-click PDF file generation
- **Text-Based PDF**: Creates an ATS friendly vector PDF file with crisp rendering. No rasterizing.

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Getting Started 
### Setup

1. Clone or navigate to this repository
2. Install dependencies:

```bash
npm install
```

### Start server


```bash
npm run dev
```

The server will start at `http://localhost:3000` and automatically restart when you modify any server files.

## View Your Resume

1. Edit `resume.md`
2. Save the file and watch the browser update automatically

##  Export to PDF

1. Click the **"📄 Export as PDF"** button in the top-right corner
2. The PDF will generate and open in a new tab automatically
3. Save or print the PDF as needed

The PDF is generated server-side using Puppeteer (headless Chrome) for accurate rendering and true vector text output.

## Customization

### Everything
It's open source :)

## How It Works

1. **Server**: Express serves the HTML page and provides API endpoints for markdown content and PDF generation
2. **File Watching**: chokidar monitors `resume.md` for changes
3. **Live Updates**: When the file changes, the server pushes an event via Server-Sent Events
4. **Client**: The browser receives the event and fetches the updated content
5. **Rendering**: marked converts markdown to HTML, styled with the CSS
6. **PDF Export**: When requested, Puppeteer generates a PDF server-side with complete HTML and inline CSS

## Technology Stack

- **Runtime**: Node.js
- **Web Framework**: Express
- **Markdown Parser**: marked
- **File Watcher**: chokidar
- **Live Updates**: Server-Sent Events (SSE)
- **PDF Generation**: Puppeteer (headless Chrome)

## License

MIT

## Author

Brandon Bellero
