# PDF Styling - Match Webpage Implementation

## Overview
This document describes the changes made to ensure PDF exports match the webpage styling while maintaining print optimization.

## Problem Statement

### Original Behavior
The PDF export used extensive `@media print` CSS rules that completely transformed the webpage appearance:

**Problematic Overrides:**
- Forced all text to black (`color: #000 !important`)
- Changed font sizes to print-specific units (11pt, 12pt, 14pt, 20pt)
- Reduced line-height to 1.4 for tighter spacing
- Added external URLs in parentheses after links
- Applied custom heading borders and spacing
- Overrode GitHub markdown color scheme

**Result:** PDF looked significantly different from the webpage, defeating the purpose of "what you see is what you get."

### User Requirements
After investigation and clarification:
- ✓ Match webpage font sizes and spacing exactly
- ✓ Use webpage link colors and styling (blue, underlined)
- ✓ Remove decorative elements for clean printing (no background, shadow, borders)
- ✓ Hide export button in PDF
- ✗ Don't add URLs to links
- ✗ Don't force black text

## Solution

### Strategy
Simplify the `@media print` rules to do **only** what's necessary for print optimization, allowing the webpage's GitHub markdown styling to pass through naturally.

### CSS Changes

**File:** `public/style.css`

**Before:** ~150 lines of aggressive print overrides (lines 69-215)

**After:** ~20 lines of minimal print adjustments

#### What We Keep
1. **Hide export controls** - Button shouldn't appear in PDF
2. **Remove container decorations** - No gray background, shadow, or rounded corners
3. **Page break controls** - Prevent awkward content splits
4. **Basic layout adjustments** - Remove padding/margins from container

#### What We Remove
1. **All font size overrides** - Let GitHub markdown CSS handle typography
2. **All color overrides** - Preserve GitHub's color scheme
3. **Line-height changes** - Keep webpage spacing
4. **Link URL display** - No `::after` content
5. **Custom heading styling** - Use GitHub's markdown heading styles
6. **Forced black text** - Allow natural colors

### Implementation Details

#### New @media print Rules
```css
@media print {
  /* Hide export controls in print/PDF */
  .export-controls {
    display: none !important;
  }

  /* Remove decorative styling for clean print output */
  body {
    background-color: white;
    padding: 0;
    margin: 0;
  }

  .container {
    max-width: 100%;
    padding: 0;
    margin: 0;
    box-shadow: none;
    border-radius: 0;
    background-color: white;
  }

  /* Basic content padding */
  .markdown-body {
    padding: 0.5in;
  }

  /* Page break controls to prevent awkward splits */
  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    page-break-after: avoid;
  }

  .markdown-body ul,
  .markdown-body ol,
  .markdown-body p {
    page-break-inside: avoid;
  }
}
```

#### @page Rule
The `@page` rule is removed since Puppeteer controls margins directly via the `margin` parameter in `server.js`.

## Technical Details

### How Puppeteer Generates PDFs

**File:** `server.js` (lines 44-120)

Puppeteer's PDF generation process:
1. Reads GitHub markdown CSS and custom CSS files
2. Inlines both CSS files into a complete HTML document
3. Uses `page.setContent()` to load the HTML
4. Calls `page.pdf()` with configuration:
   - `printBackground: true` - Renders background colors
   - `format: 'Letter'` - US Letter size (8.5" × 11")
   - Custom margins: top 0.25", sides/bottom 0.5"

**Key Insight:** When `page.pdf()` is called, it triggers CSS print media queries (`@media print`), which is why these rules affect the PDF but not the webpage.

### CSS Cascade

**Webpage View:**
1. GitHub markdown CSS (linked externally)
2. Custom style.css screen rules (linked externally)
3. `@media print` rules are present but ignored

**PDF Generation:**
1. GitHub markdown CSS (inlined in HTML)
2. Custom style.css screen rules (inlined in HTML)
3. `@media print` rules **activate** due to Puppeteer's print mode
4. Any `!important` rules in print styles override everything

### Why This Works

By removing aggressive overrides in `@media print`, we allow the natural CSS cascade to work:

1. GitHub markdown CSS provides base styling
2. Custom screen CSS adds container styling
3. Minimal print CSS only removes decorative elements
4. Result: PDF inherits webpage appearance automatically

## Testing

### Manual Testing Checklist
After implementing changes:

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open webpage:** http://localhost:3000

3. **Compare visual appearance:**
   - Note font sizes, colors, and spacing in browser

4. **Generate PDF:**
   - Click "Export as PDF" button
   - PDF opens in new tab

5. **Verify PDF matches webpage:**
   - [ ] Font sizes match (not smaller or in pt units)
   - [ ] Headings use same color and weight
   - [ ] Links are blue and underlined (not black)
   - [ ] Paragraphs have same spacing
   - [ ] No URLs appear in parentheses after links
   - [ ] Export button is hidden in PDF
   - [ ] No gray background or shadow (clean white)

### Expected Results

**Webpage appearance preserved in PDF:**
- Typography matches exactly
- Colors match exactly (GitHub markdown colors)
- Links styled identically

**Print optimizations still work:**
- Clean white background
- No decorative container styling
- Export button hidden
- Page breaks avoid splitting headings from content

## Rollback Plan

If issues arise, the previous extensive `@media print` rules can be restored by reverting the changes to `public/style.css`.

**Git rollback:**
```bash
git checkout HEAD~1 public/style.css
```

## Related Documentation

- `docs/pdf-export-feature.md` - Original PDF implementation plan
- `docs/pdf-library-research.md` - Research on Puppeteer migration
- `README.md` - General project documentation

## Change History

- **2025-10-28** - Simplified @media print rules to match webpage styling
- **Previous** - Extensive print overrides with custom typography and colors
