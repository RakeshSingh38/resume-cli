/**
 * Dependency management utilities
 * Safely imports optional packages and handles missing dependencies gracefully
 * This prevents the CLI from crashing if someone doesn't have all packages installed
 */

/**
 * Safely try to import a package without crashing if it's missing
 * Returns null if the package isn't available
 * 
 * @param {String} mod - Name of the module to import
 * @returns {Object|null} The imported module or null if not found
 */
function safeRequire(mod) {
  try { 
    return require(mod); 
  } catch { 
    return null; 
  }
}

// Import all the optional packages we might use for fancy features
const clearLib = safeRequire('clear');           // Clears the terminal screen
const figletLib = safeRequire('figlet');         // Creates ASCII art text
const gradientLib = safeRequire('gradient-string'); // Adds color gradients to text
const boxenLib = safeRequire('boxen');           // Draws boxes around content
const commanderLib = safeRequire('commander');   // Parses command line arguments
const chalkLib = safeRequire('chalk');           // Adds colors to terminal text
const inkLib = safeRequire('ink');               // React-like components for terminal
const React = safeRequire('react');              // For React-based terminal UI
const App = safeRequire('../cli/App');           // Our custom React terminal app

// Handle different ways packages might export themselves (ESM vs CommonJS)
// Some packages export as .default, others don't - we need to handle both

/**
 * Normalize chalk import to work with different module systems
 * Chalk can be tricky because it changed how it exports between versions
 */
const chalk = (() => {
  if (!chalkLib) return null;
  // Try to get the actual chalk object, whether it's default export or not
  const c = chalkLib.default ? chalkLib.default : chalkLib;
  // Make sure it actually has the methods we need
  return (c && typeof c.bold === 'function') ? c : null;
})();

/**
 * Normalize boxen import - handle both ESM and CommonJS exports
 */
const boxen = boxenLib ? (boxenLib.default ? boxenLib.default : boxenLib) : null;

module.exports = {
  clearLib,
  figletLib, 
  gradientLib,
  boxen,
  commanderLib,
  chalk,
  inkLib,
  React,
  App
};