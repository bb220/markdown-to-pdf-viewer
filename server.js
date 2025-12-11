const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const chokidar = require('chokidar');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;
const RESUME_PATH = path.join(__dirname, 'resume.md');

// Store connected SSE clients
let clients = [];

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true
});

// Serve static files from public directory
app.use(express.static('public'));

// Serve github-markdown-css from node_modules
app.use('/css', express.static(path.join(__dirname, 'node_modules/github-markdown-css')));

// Main route - serves the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get rendered markdown
app.get('/api/markdown', (req, res) => {
  try {
    const markdown = fs.readFileSync(RESUME_PATH, 'utf-8');
    const html = marked(markdown);
    res.json({ html });
  } catch (error) {
    console.error('Error reading markdown file:', error);
    res.status(500).json({ error: 'Failed to read markdown file' });
  }
});

// API endpoint to generate PDF using Puppeteer
app.get('/api/generate-pdf', async (req, res) => {
  try {
    console.log('Starting PDF generation...');

    // Read markdown and convert to HTML
    const markdown = fs.readFileSync(RESUME_PATH, 'utf-8');
    const contentHtml = marked(markdown);

    // Read CSS files
    const githubCss = fs.readFileSync(
      path.join(__dirname, 'node_modules/github-markdown-css/github-markdown.css'),
      'utf-8'
    );
    const customCss = fs.readFileSync(
      path.join(__dirname, 'public/style.css'),
      'utf-8'
    );

    // Generate complete HTML with inline styles
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>John Karpathy - Resume</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    ${githubCss}
    ${customCss}
  </style>
</head>
<body>
  <div class="container">
    <article class="markdown-body">
      ${contentHtml}
    </article>
  </div>
</body>
</html>`;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to match Letter page printable area (8.5" - 1" margins = 7.5" x 10")
    await page.setViewport({
      width: 720,   // 7.5" at 96 DPI
      height: 960,  // 10" at 96 DPI
      deviceScaleFactor: 1
    });

    // Set content directly instead of navigating to avoid deadlock
    await page.setContent(fullHtml, { waitUntil: 'load' });

    // Generate PDF with specified margins
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      scale: 1,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    await browser.close();

    // Send PDF to client
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="John_Karpathy_Resume.pdf"');
    res.send(pdf);

    console.log('✅ PDF generated successfully');
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Server-Sent Events endpoint for live updates
app.get('/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Add this client to the list
  clients.push(res);

  console.log(`Client connected. Total clients: ${clients.length}`);

  // Remove client when connection closes
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
    console.log(`Client disconnected. Total clients: ${clients.length}`);
  });
});

// Function to notify all connected clients
function notifyClients() {
  console.log(`Notifying ${clients.length} client(s) of update`);
  clients.forEach(client => {
    client.write('data: {"type":"update"}\n\n');
  });
}

// Watch resume.md for changes
const watcher = chokidar.watch(RESUME_PATH, {
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (filePath) => {
  console.log(`File changed: ${filePath}`);
  notifyClients();
});

watcher.on('error', (error) => {
  console.error('Watcher error:', error);
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Resume server running!`);
  console.log(`📝 Open http://localhost:${PORT} in your browser`);
  console.log(`👀 Watching: ${RESUME_PATH}`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  watcher.close();
  process.exit(0);
});
