// Fetch and display markdown content
async function loadMarkdown() {
  try {
    const response = await fetch('/api/markdown');
    const data = await response.json();

    const contentElement = document.getElementById('markdown-content');

    // Add smooth transition
    contentElement.style.opacity = '0.5';

    setTimeout(() => {
      contentElement.innerHTML = data.html;
      contentElement.style.opacity = '1';
    }, 100);

  } catch (error) {
    console.error('Error loading markdown:', error);
    document.getElementById('markdown-content').innerHTML =
      '<p style="color: red;">Error loading resume. Please refresh the page.</p>';
  }
}

// PDF Export Function - Using Puppeteer backend
async function exportToPDF() {
  const exportBtn = document.getElementById('export-pdf-btn');

  // Show loading state
  const originalText = exportBtn.textContent;
  exportBtn.textContent = '⏳ Generating PDF...';
  exportBtn.disabled = true;

  try {
    // Call server endpoint
    const response = await fetch('/api/generate-pdf');

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    // Get PDF blob
    const blob = await response.blob();

    // Create object URL and open in new tab
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    // Reset button state
    exportBtn.textContent = originalText;
    exportBtn.disabled = false;

    console.log('✅ PDF generated successfully');
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    exportBtn.textContent = originalText;
    exportBtn.disabled = false;
    alert('Error generating PDF. Please try again.');
  }
}

// Set up Server-Sent Events for live updates
function setupLiveReload() {
  const eventSource = new EventSource('/events');

  eventSource.onopen = () => {
    console.log('✅ Connected to live reload server');
  };

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'connected') {
      console.log('🔗 Live reload connection established');
    } else if (data.type === 'update') {
      console.log('🔄 File changed, reloading content...');
      loadMarkdown();
    }
  };

  eventSource.onerror = (error) => {
    console.error('❌ Live reload connection error:', error);
    // EventSource will automatically try to reconnect
  };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadMarkdown();
  setupLiveReload();

  // Wire up export button
  const exportBtn = document.getElementById('export-pdf-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToPDF);
  }
});
