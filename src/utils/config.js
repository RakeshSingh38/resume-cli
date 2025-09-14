/**
 * Configuration utilities for parsing command line arguments and terminal capabilities
 * Handles all the CLI flag parsing and terminal detection logic
 */

/**
 * Parse command line arguments into a clean object
 * Converts --kebab-case to camelCase and handles values properly
 * 
 * @param {Array} argv - Command line arguments array
 * @returns {Object} Parsed flags object with camelCase keys
 */
function parseFlags(argv) {
  const flags = {};
  
  // Loop through all command line arguments
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    // Handle flags with equals sign: --width-perc=80
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      // Convert --kebab-case to camelCase and store the value
      flags[key.replace('--', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
      continue;
    }
    
    // Handle regular flags: --ascii, -n, --projects Timeline
    if (arg.startsWith('-')) {
      // Clean up the flag name and convert to camelCase
      const key = arg.replace(/^-+/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const nextArg = argv[i + 1];
      
      // If the next argument isn't a flag, treat it as this flag's value
      if (nextArg && !nextArg.startsWith('-')) {
        flags[key] = nextArg;
        i++; // Skip the next argument since we used it as a value
      } else {
        // No value provided, so it's just a boolean flag
        flags[key] = true;
      }
    }
  }
  
  return flags;
}

/**
 * Detect what the terminal can handle (colors, Unicode, etc.)
 * This helps us decide how fancy we can make the output
 * 
 * @param {Object} flags - Parsed command line flags
 * @returns {Object} Terminal capabilities object
 */
function getTerminalCaps(flags) {
  const isWindows = process.platform === 'win32';
  const term = process.env.TERM || '';
  
  return {
    // Use Unicode characters unless user specifically wants ASCII mode
    unicode: !flags.ascii,
    // Enable colors if user hasn't disabled them and we're in a real terminal
    color: !flags.noColor && process.stdout.isTTY,
    // Get terminal width, fallback to 80 if we can't detect it
    cols: process.stdout.columns || 80,
    // Check if we're in an interactive terminal (not being piped)
    isTTY: process.stdout.isTTY
  };
}

/**
 * Calculate how wide the resume should be displayed
 * Takes into account user preferences and terminal size
 * 
 * @param {Object} flags - Parsed command line flags
 * @param {Number} terminalCols - Width of the terminal in characters
 * @returns {Object} Width configuration object
 */
function getWidth(flags, terminalCols) {
  // Use user-specified percentage or default to 95% of terminal width
  const percentage = parseInt(flags.widthPerc) || 95;
  const maxWidth = Math.floor(terminalCols * percentage / 100);
  
  return {
    // Never go wider than 120 characters (keeps text readable)
    contentWidth: Math.min(maxWidth, 120),
    percentage
  };
}

module.exports = {
  parseFlags,
  getTerminalCaps,
  getWidth
};