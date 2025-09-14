/**
 * JSON Resume schema conversion utilities
 * Converts our custom resume format to the standard JSON Resume schema
 * Also includes utilities for working with JSON data and paths
 */

/**
 * Convert our custom resume format to JSON Resume schema format
 * JSON Resume is a standardized format used by many resume tools
 * 
 * @param {Object} data - Our custom resume data
 * @returns {Object} Resume in JSON Resume schema format
 */
function toJsonResume(data) {
  // Build the basic information section
  const basics = {
    name: data.name || '',
    email: data.contact?.email || undefined,
    phone: data.contact?.phone || undefined,
    location: parseLocation(data.location),
    profiles: []
  };
  
  // Add LinkedIn profile if available
  if (data.contact?.linkedin) {
    basics.profiles.push({
      network: 'LinkedIn',
      username: data.contact.linkedin,
      url: linkifyLinkedIn(data.contact.linkedin)
    });
  }
  
  // Initialize arrays for different resume sections
  const education = [];
  const skills = [];
  const projects = [];
  const awards = [];
  
  // Process each section and convert to JSON Resume format
  for (const section of data.sections || []) {
    const title = (section.title || '').toLowerCase();
    
    if (title.startsWith('education')) {
      processEducation(section, education);
    } else if (title.startsWith('skills')) {
      processSkills(section, skills);
    } else if (title.startsWith('projects')) {
      processProjects(section, projects);
    } else if (title.startsWith('achievements') || title.startsWith('certifications')) {
      processAwards(section, awards);
    }
  }
  
  // Return the complete JSON Resume object
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics,
    education,
    skills,
    projects,
    awards
  };
}

/**
 * Parse location string into JSON Resume location format
 * Handles formats like "City, ST" or just "Region"
 * 
 * @param {String} loc - Location string
 * @returns {Object} Parsed location object
 */
function parseLocation(loc) {
  if (!loc) return undefined;
  // Try to match "City, CountryCode" pattern
  const m = loc.match(/^\s*([^,]+)\s*,\s*([A-Za-z]{2})\s*$/);
  return m ? { city: m[1], countryCode: m[2] } : { region: loc };
}

/**
 * Convert LinkedIn handle to full URL
 * Handles various formats like usernames, handles, or full URLs
 * 
 * @param {String} handle - LinkedIn handle or URL
 * @returns {String} Full LinkedIn URL
 */
function linkifyLinkedIn(handle) {
  const h = String(handle).trim();
  if (/^https?:\/\//i.test(h)) return h; // Already a full URL
  if (/^in\//i.test(h)) return 'https://linkedin.com/' + h; // Starts with "in/"
  return 'https://linkedin.com/in/' + h.replace(/^@/, ''); // Clean up @ symbol
}

/**
 * Convert education section to JSON Resume format
 * 
 * @param {Object} section - Education section from our data
 * @param {Array} education - Array to add education items to
 */
function processEducation(section, education) {
  for (const item of section.items || []) {
    const { startDate, endDate } = parsePeriod(item.period);
    education.push({
      institution: item.institution || '',
      area: item.degree || item.score || '',
      studyType: item.degree ? 'Bachelor' : undefined,
      score: (item.gpa || item.score || '').replace(/\s*CGPA/i, '').trim() || undefined,
      startDate,
      endDate,
      location: item.location || undefined
    });
  }
}

/**
 * Convert skills section to JSON Resume format
 * 
 * @param {Object} section - Skills section from our data
 * @param {Array} skills - Array to add skill categories to
 */
function processSkills(section, skills) {
  for (const cat of section.categories || []) {
    skills.push({
      name: cat.name || 'Skills',
      keywords: cat.skills || []
    });
  }
}

/**
 * Convert projects section to JSON Resume format
 * 
 * @param {Object} section - Projects section from our data
 * @param {Array} projects - Array to add projects to
 */
function processProjects(section, projects) {
  for (const p of section.projects || []) {
    projects.push({
      name: p.name || '',
      description: p.subtitle || undefined,
      highlights: p.highlights || [],
      keywords: p.stack || [],
      url: p.links?.demo || p.links?.github || undefined
    });
  }
}

/**
 * Convert achievements/certifications section to JSON Resume awards format
 * 
 * @param {Object} section - Achievements section from our data
 * @param {Array} awards - Array to add awards/achievements to
 */
function processAwards(section, awards) {
  for (const a of section.achievements || []) {
    awards.push({
      title: a.name || '',
      date: parseMonthYear(a.date),
      awarder: undefined,
      summary: undefined
    });
  }
}

/**
 * Parse period strings like "Dec 2020 - May 2024" into start/end dates
 * 
 * @param {String} period - Period string to parse
 * @returns {Object} Object with startDate and endDate
 */
function parsePeriod(period) {
  if (!period) return { startDate: undefined, endDate: undefined };
  
  // Month name to number mapping
  const months = { 
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', 
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' 
  };
  
  const parts = period.split('-').map(s => s.trim());
  
  // Convert "Month Year" to ISO date format
  const toDate = (s) => {
    const m = s.match(/([A-Za-z]{3,})\s+(\d{4})/);
    if (!m) return undefined;
    const mm = months[m[1].toLowerCase().slice(0, 3)] || '01';
    return `${m[2]}-${mm}-01`;
  };
  
  // Handle both single dates and date ranges
  return parts.length === 2 
    ? { startDate: toDate(parts[0]), endDate: toDate(parts[1]) }
    : { startDate: undefined, endDate: toDate(parts[0]) };
}

/**
 * Parse single month/year strings like "Jul 2025" into ISO date format
 * 
 * @param {String} s - Month/year string to parse
 * @returns {String} ISO date string or undefined
 */
function parseMonthYear(s) {
  if (!s) return undefined;
  const m = s.match(/([A-Za-z]{3,})\s+(\d{4})/);
  if (!m) return undefined;
  
  const months = { 
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', 
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' 
  };
  
  const mm = months[m[1].toLowerCase().slice(0, 3)] || '01';
  return `${m[2]}-${mm}-01`;
}

/**
 * Utilities for working with JSON paths and data extraction
 */

/**
 * Get a value from an object using a dot-notation path
 * Supports array indexing like "skills[0].name" or "education.0.institution"
 * 
 * @param {Object} obj - Object to extract from
 * @param {String} pathExpr - Path expression like "basics.name" or "skills[0]"
 * @returns {*} Value at the path, or undefined if not found
 */
function getByPath(obj, pathExpr) {
  if (!pathExpr) return obj;
  
  // Convert array bracket notation to dot notation: skills[0] -> skills.0
  const norm = pathExpr.replace(/\[(\d+)\]/g, '.$1');
  const parts = norm.split('.').filter(Boolean);
  
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * Print a value to stdout in a nice format
 * Handles different data types appropriately
 * 
 * @param {*} val - Value to print
 */
function printValue(val) {
  if (val == null) {
    process.stdout.write('\n');
    return;
  }
  
  // Simple values get printed as-is
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    process.stdout.write(String(val) + '\n');
    return;
  }
  
  // Complex objects get JSON formatting
  process.stdout.write(JSON.stringify(val, null, 2) + '\n');
}

module.exports = {
  toJsonResume,
  getByPath,
  printValue
};