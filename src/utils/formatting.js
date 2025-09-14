/**
 * Text formatting and color utilities
 * Handles text wrapping, colors, and formatting for terminal display
 */

/**
 * Apply ANSI color codes to text when colors are supported
 * This is our fallback when chalk isn't available
 * 
 * @param {String} str - Text to color
 * @param {String} code - ANSI color code
 * @param {Boolean} colorSupported - Whether terminal supports colors
 * @returns {String} Colored text or plain text if colors not supported
 */
function color(str, code, colorSupported) {
  if (!colorSupported) return str;
  const reset = '\u001b[0m'; // Reset color code
  return `${code}${str}${reset}`;
}

/**
 * Create a color function object, using chalk if available or fallback colors
 * This ensures we always have color functions available even without chalk
 * 
 * @param {Object} chalk - Chalk library object (might be null)
 * @param {Boolean} colorSupported - Whether terminal supports colors
 * @returns {Object} Object with color functions (bold, cyan, etc.)
 */
function createColors(chalk, colorSupported) {
  // If we have chalk, use it - it's much better
  if (chalk) return chalk;
  
  // Otherwise, create our own basic color functions using ANSI codes
  return {
    bold: (s) => color(s, '\u001b[1m', colorSupported),      // Bold text
    cyan: (s) => color(s, '\u001b[36m', colorSupported),     // Cyan color
    blueBright: (s) => color(s, '\u001b[94m', colorSupported), // Bright blue
    gray: (s) => color(s, '\u001b[90m', colorSupported)      // Gray text
  };
}

/**
 * Smart text wrapping that preserves bullet points and indentation
 * This handles both regular text and bullet-pointed lists nicely
 * 
 * @param {String} text - Text to wrap
 * @param {Number} width - Maximum width in characters
 * @param {Boolean} unicode - Whether to use Unicode bullet points
 * @returns {Array} Array of wrapped lines
 */
function wrapText(text, width, unicode) {
  // Check if this line starts with a bullet point (• or -)
  const bulletMatch = text.match(/^(\s*)([•\-])\s+(.*)$/);
  
  if (bulletMatch) {
    // This is a bullet point - handle it specially
    const [, space, bullet, rest] = bulletMatch;
    const b = unicode ? '•' : '-'; // Use appropriate bullet character
    const prefix = `${space}${b} `;
    
    // Wrap the text after the bullet, then add proper indentation
    return wrapCore(rest, width - prefix.length)
      .map((line, index) => 
        index === 0 
          ? prefix + line                    // First line gets the bullet
          : ' '.repeat(prefix.length) + line // Other lines get indented
      );
  }
  
  // Regular text - just wrap normally
  return wrapCore(text, width);
}

/**
 * Core text wrapping logic - breaks text into lines that fit within width
 * Uses word boundaries so we don't break words in half
 * 
 * @param {String} text - Text to wrap
 * @param {Number} width - Maximum width in characters
 * @returns {Array} Array of lines that fit within the width
 */
function wrapCore(text, width) {
  const words = text.split(/\s+/); // Split on whitespace
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if (!currentLine) {
      // First word on the line
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= width) {
      // Word fits on current line
      currentLine += ' ' + word;
    } else {
      // Word doesn't fit - start a new line
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  // Don't forget the last line
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Clean up fancy Unicode characters for ASCII-only terminals
 * Replaces Unicode characters with ASCII equivalents for compatibility
 * 
 * @param {String} line - Line of text to sanitize
 * @param {Boolean} unicode - Whether Unicode is supported
 * @returns {String} Sanitized line with ASCII characters
 */
function sanitizeLine(line, unicode) {
  // If Unicode is supported, don't change anything
  if (unicode) return line;
  
  // Replace fancy characters with ASCII equivalents
  return line
    .replace(/•/g, '-')                    // Bullet points become dashes
    .replace(/[–—]/g, '-')                 // En/em dashes become regular dashes
    .replace(/┌|┐|└|┘|─|│/g, '-')         // Box drawing characters become dashes
    .replace(/[""]/g, '"')                 // Smart quotes become regular quotes
    .replace(/['']/g, "'");                // Smart apostrophes become regular ones
}

module.exports = {
  createColors,
  wrapText,
  sanitizeLine
};