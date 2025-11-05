/**
 * rendering utilities for creating boxes, headers, and formatted output
 * handles the visual presentation of the resume content
 */

const { wrapText, sanitizeLine } = require('./formatting');

/**
 * create a bordered box around content with proper text wrapping
 * uses boxen if available, otherwise falls back to manual box drawing
 * 
 * @param {String} content - Text content to put in the box
 * @param {Object} options - Rendering options (boxen, unicode, colors, width)
 * @returns {String} Content wrapped in a bordered box
 */
function createBox(content, { boxen, unicode, colorSupported, contentWidth }) {
  // split content into lines and clean up Unicode if needed
  const lines = content.split(/\r?\n/).map(l => sanitizeLine(l, unicode));
  
  // wrap long lines to fit within the box width
  const wrapped = [];
  for (const line of lines) {
    if (!line.trim()) {
      // Keep empty lines as-is
      wrapped.push('');
      continue;
    }
    // Wrap long lines, preserving bullet points and indentation
    wrapped.push(...wrapText(line, contentWidth));
  }
  
  // Try to use the boxen library if it's available (makes prettier boxes)
  if (boxen && typeof boxen === 'function') {
    const borderStyle = unicode ? 'round' : 'classic'; // Rounded corners for Unicode
    return boxen(wrapped.join('\n'), {
      padding: { top: 1, bottom: 1, left: 2, right: 2 }, // Add some padding inside
      borderStyle,
      borderColor: colorSupported ? 'blueBright' : undefined,
      align: 'left'
    });
  }
  
  // Fallback: draw the box manually using ASCII/Unicode characters
  const chars = unicode 
    ? { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' } // Nice Unicode box chars
    : { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' }; // Basic ASCII chars
  
  // Calculate box width based on longest line
  const width = Math.max(20, Math.max(...wrapped.map(l => l.length)));
  const pad = (s) => s + ' '.repeat(Math.max(0, width - s.length)); // Right-pad strings
  const innerPad = '  '; // Padding inside the box
  
  // Build the box line by line
  const top = chars.tl + chars.h.repeat(width + 4) + chars.tr;
  const bottom = chars.bl + chars.h.repeat(width + 4) + chars.br;
  const emptyLine = `${chars.v}${' '.repeat(width + 4)}${chars.v}`;
  const bodyLines = wrapped.map(l => `${chars.v}${innerPad}${pad(l)}${innerPad}${chars.v}`);
  
  return [top, emptyLine, ...bodyLines, emptyLine, bottom].join('\n');
}

/**
 * Create a fancy header with ASCII art and colors
 * Can clear the screen and create large ASCII text if libraries are available
 * 
 * @param {String} name - Name to display in the header
 * @param {Object} options - Libraries and settings for rendering
 * @returns {String} Formatted header text
 */
function createHeader(name, { figletLib, gradientLib, clearLib, colors, caps, flags }) {
  const { isTTY } = caps;
  const doClear = !flags.noClear && isTTY;  // Should we clear the screen?
  const useFancy = !flags.plain && isTTY;   // Should we use fancy features?
  
  // Clear the terminal screen if we can and should
  if (clearLib && doClear) clearLib();
  
  // Start with just uppercase name as fallback
  let banner = name ? name.toUpperCase() : '';
  
  // Try to create ASCII art text if figlet is available
  if (useFancy && figletLib && name) {
    try {
      const maxWidth = Math.min(caps.cols - 2, 120); // Don't exceed terminal width
      banner = figletLib.textSync(name, { 
        font: 'Big',                // Use Big font for better spacing
        width: maxWidth,            // Limit width to terminal size
        whitespaceBreak: true,      // Break on whitespace if needed
        horizontalLayout: 'full'    // Full spacing between characters
      });
    } catch {
      // If figlet fails, just use the uppercase name
      banner = name.toUpperCase();
    }
  }
  
  // Add gradient colors if the gradient library is available
  if (useFancy && gradientLib && caps.color) {
    try {
      return gradientLib.pastel.multiline(banner); // Pretty rainbow colors
    } catch {
      return colors.bold(banner); // Fallback to just bold text
    }
  }
  
  // Final fallback: just bold text
  return colors.bold(banner);
}

module.exports = {
  createBox,
  createHeader
};