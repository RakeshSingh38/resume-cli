/**
 * Resume data loading and parsing utilities
 * Handles loading resume data from JSON or plain text files
 * Includes fallback parsing for backwards compatibility
 */

const fs = require('fs');
const path = require('path');

/**
 * Load resume data from JSON file, with fallback to text parsing
 * This allows the CLI to work with both structured JSON and simple text files
 * 
 * @returns {Object} Parsed resume data in consistent JSON format
 */
function loadResumeData() {
  const jsonPath = path.join(__dirname, '..', '..', 'resume.json');
  const txtPath = path.join(__dirname, '..', '..', 'resume.txt');
  
  // First try to load the structured JSON file
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      // If JSON parsing fails, fall through to text parsing
    }
  }
  
  // If no JSON file, try to load from text file
  let text = '';
  if (fs.existsSync(txtPath)) {
    text = fs.readFileSync(txtPath, 'utf8');
  } else {
    // Last resort: use embedded resume data so the CLI always works
    text = `RAKESH RAMKISHOR SINGH\nNavi Mumbai, IN\nrakeshsinghtcp@gmail.com • +91 7021134166 • LinkedIn: iamrakesh.codes\n\nEducation\nSmt. Indira Gandhi College of Engineering | Ghansoli (Dec 2020 - May 2024)\n- Bachelor of Engineering in CSE (IOT) • CGPA: 8.2\n\nTechnical Skills\nFrontend: HTML, CSS, JavaScript (ES6+), TypeScript, React.js, Next.js\nBackend & Databases: Node.js, Express.js, MongoDB, PostgreSQL\n\nProjects\nTimeline – Role-based Workspace Manager | Next.js, Socket.io, Node.js\n- Real-time presence tracking and analytics\n\nCertifications & Achievements\n- MongoDB Node.js Developer Path – MongoDB University (Jul 2025)`;
  }
  
  // Parse the plain text into our JSON structure
  return parseTextToJson(text);
}

/**
 * Parse plain text resume into structured JSON format
 * This maintains backwards compatibility with simple text files
 * 
 * @param {String} text - Plain text resume content
 * @returns {Object} Structured resume data
 */
function parseTextToJson(text) {
  const lines = text.split(/\r?\n/);
  
  // Extract basic info from first few lines
  const name = lines[0]?.trim() || '';        // First line is the name
  const location = lines[1]?.trim() || '';    // Second line is location
  const contactLine = lines[2]?.trim() || '';  // Third line has contact info
  
  // Use regex to extract contact information from the contact line
  const emailMatch = contactLine.match(/([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/);
  const phoneMatch = contactLine.match(/(\+?\d[\d \-]{6,}\d)/);
  const linkedinMatch = contactLine.match(/LinkedIn\s*:?\s*([^\s]+)/i);
  
  const contact = {
    email: emailMatch?.[1] || null,
    phone: phoneMatch?.[1] || null,
    linkedin: linkedinMatch?.[1] || null
  };
  
  // Parse the rest of the text into sections (Education, Skills, etc.)
  const sections = [];
  let currentSection = null;
  
  // Start from line 3 (skip name, location, contact)
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    
    if (isSectionHeader(line)) {
      // Found a new section header - save the previous one and start a new one
      if (currentSection) sections.push(currentSection);
      currentSection = { 
        title: normalizeHeader(line), 
        lines: [] 
      };
    } else if (currentSection) {
      // Add this line to the current section
      currentSection.lines.push(line);
    }
  }
  
  // Don't forget to add the last section
  if (currentSection) sections.push(currentSection);
  
  return { name, location, contact, sections };
}

/**
 * Check if a line looks like a section header (Education, Skills, etc.)
 * 
 * @param {String} line - Line to check
 * @returns {Boolean} True if it's a section header
 */
function isSectionHeader(line) {
  return /^(Education|Technical Skills|Projects|Certifications|Certifications and Achievements)\b/i.test(line.trim());
}

/**
 * Normalize section header names to consistent format
 * This helps ensure consistent section names regardless of input format
 * 
 * @param {String} line - Section header line
 * @returns {String} Normalized section name
 */
function normalizeHeader(line) {
  const l = line.trim();
  if (/^Technical Skills\b/i.test(l)) return 'Skills';
  if (/^Certifications(?: and Achievements)?\b/i.test(l)) return 'Achievements';
  return l;
}

module.exports = {
  loadResumeData
};