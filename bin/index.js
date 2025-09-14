#!/usr/bin/env node
/**
 * 📄 Rakesh's Resume CLI - Display resume in terminal with simple commands
 *
 * This is the main entry point for the resume CLI tool.
 * It provides a clean, modular way to display resume information
 * with various formatting options and simple commands.
 *
 * Key features:
 * - Simple shorthand commands (-n, -e, -p, etc.)
 * - Multiple display modes (Unicode, ASCII, Plain)
 * - JSON export capabilities
 * - Project and link management
 * - Responsive terminal display
 */

// Import all our utility modules
const {
    parseFlags,
    getTerminalCaps,
    getWidth,
} = require("../src/utils/config");
const { createColors } = require("../src/utils/formatting");
const { loadResumeData } = require("../src/utils/data");
const { createBox, createHeader } = require("../src/utils/render");
const { toJsonResume, getByPath, printValue } = require("../src/utils/json");
const {
    commanderLib,
    chalk,
    inkLib,
    React,
    App,
    figletLib,
    gradientLib,
    clearLib,
    boxen,
} = require("../src/utils/deps");

/**
 * Set up the command line interface with all available options
 * Uses Commander.js if available, otherwise falls back to manual parsing
 *
 * @returns {Array} Array of command line arguments
 */
function setupCLI() {
    // If Commander.js isn't available, just return raw arguments
    if (!commanderLib) return process.argv.slice(2);

    const { program } = commanderLib;
    program
        .name("resume")
        .description("📄 Display Rakesh's resume in terminal")
        .version("1.0.0")

        // Simple commands
        .option("-n, --name", "Show name")
        .option("-e, --email", "Show email")
        .option("-p, --phone", "Show phone")
        .option("-l, --location", "Show location")
        .option("-s, --skills", "Show skills")
        .option(
            "-j, --projects [name]",
            "Show projects (optionally filter by name/number)"
        )
        .option("-a, --achievements", "Show achievements")
        .option("--contact", "Show all contact info")
        .option("--education", "Show education")
        .option("--portfolio", "Show portfolio link")
        .option("--github", "Show GitHub profile")
        .option("--download", "Show resume download link")
        .option(
            "--save [filename]",
            "Save resume to file (default: rakesh-resume.txt)"
        )
        .option(
            "--links [project]",
            "Show project links (optionally filter by project name/number)"
        )

        // Output formats
        .option("--json", "Output JSON")
        .option("--json-resume", "Output JSON Resume format")

        // Display options
        .option("--ascii", "ASCII borders")
        .option(
            "--unicode",
            "Force Unicode borders (overrides platform detection)"
        )
        .option("--no-color", "No colors")
        .option("--plain", "No fancy header")
        .option("--width-perc <pct>", "Width percentage (default: 95)")

        .allowUnknownOption(true); // Don't fail on unknown options

    try {
        program.parse(process.argv);
        const opts = program.opts();

        // Convert Commander.js options back to simple flag array format
        // This maintains compatibility with our parseFlags function
        const flags = [];
        Object.entries(opts).forEach(([key, value]) => {
            if (value === true) {
                // Boolean flags like --ascii
                flags.push(`--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`);
            } else if (value && value !== false) {
                // Flags with values like --projects=Timeline
                flags.push(
                    `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}=${value}`
                );
            }
        });

        return flags;
    } catch (e) {
        // If Commander.js fails, fall back to raw arguments
        return process.argv.slice(2);
    }
}

/**
 * Helper function to find a resume section by type
 * Case-insensitive matching for flexibility
 *
 * @param {Object} data - Resume data object
 * @param {String} type - Section type to find (e.g., 'skill', 'project')
 * @returns {Object|undefined} Found section or undefined
 */
const getSection = (data, type) =>
    data.sections.find((s) => s.title.toLowerCase().includes(type));

/**
 * Simple command handlers for quick information access
 * Each function takes resume data and displays specific information
 * This object-based approach makes it easy to add new commands
 */
const simpleCommands = {
    // Basic contact information commands
    name: (data) => console.log(data.name),
    email: (data) => console.log(data.contact?.email || ""),
    phone: (data) => console.log(data.contact?.phone || ""),
    location: (data) => console.log(data.location || ""),

    // Show all contact information at once
    contact: (data) => {
        console.log(`Name: ${data.name}`);
        console.log(`Email: ${data.contact?.email || ""}`);
        console.log(`Phone: ${data.contact?.phone || ""}`);
        console.log(`Location: ${data.location || ""}`);
        console.log(`LinkedIn: ${data.contact?.linkedin || ""}`);
    },

    // Display technical skills by category
    skills: (data) => {
        const section = getSection(data, "skill");
        section?.categories?.forEach((cat) =>
            console.log(`${cat.name}: ${cat.skills.join(", ")}`)
        );
    },

    // Show education history with details
    education: (data) => {
        const section = getSection(data, "education");
        section?.items?.forEach((item) => {
            console.log(
                `${item.institution}${
                    item.location ? " | " + item.location : ""
                }`
            );
            console.log(
                `${item.degree}${
                    item.gpa || item.score
                        ? " • " + (item.gpa || item.score)
                        : ""
                }`
            );
            console.log(`Period: ${item.period || "N/A"}\n`);
        });
    },

    // List achievements and certifications
    achievements: (data) => {
        const section = getSection(data, "achievement");
        section?.achievements?.forEach((ach, i) =>
            console.log(
                `${i + 1}. ${ach.name}${ach.date ? " (" + ach.date + ")" : ""}`
            )
        );
    },

    // Show projects with optional filtering by name or number
    projects: (data, query) => {
        const section = getSection(data, "project");
        if (!section?.projects) return;

        // Show specific project details
        if (query && query !== true && typeof query === "string") {
            const project = section.projects.find(
                (p, i) =>
                    p.name.toLowerCase().includes(query.toLowerCase()) ||
                    (i + 1).toString() === query
            );

            if (project) {
                console.log(`${project.name} - ${project.subtitle}`);
                console.log(`Stack: ${project.stack.join(", ")}\n`);
                console.log("Highlights:");
                project.highlights.forEach((h) => console.log(`• ${h}`));
            } else {
                console.log(
                    `Project "${query}" not found.\nAvailable projects:`
                );
                section.projects.forEach((p, i) =>
                    console.log(`${i + 1}. ${p.name}`)
                );
            }
        } else {
            // Show overview of all projects
            section.projects.forEach((proj, i) => {
                console.log(`${i + 1}. ${proj.name} - ${proj.subtitle}`);
                console.log(`   Stack: ${proj.stack.join(", ")}\n`);
            });
        }
    },

    // Show portfolio website URL
    portfolio: (data) => {
        if (data.contact?.portfolio) {
            console.log(data.contact.portfolio);
        } else {
            console.log("Portfolio link not found");
        }
    },

    // Show GitHub profile URL
    github: (data) => {
        if (data.contact?.github) {
            console.log(data.contact.github);
        } else {
            console.log("GitHub profile not found");
        }
    },

    // Show resume download link
    download: (data) => {
        console.log("https://iamrakesh.codes/resume");
    },

    // Save resume to file
    save: (data, filename) => {
        const fs = require("fs");
        const path = require("path");

        // Use provided filename or default
        const outputFile =
            filename && filename !== true ? filename : "rakesh-resume.txt";

        // Create colors object for plain text formatting
        const colors = {
            bold: (s) => s.toUpperCase(),
            blueBright: (s) => s,
            gray: (s) => s,
        };

        // Format the resume content
        const content = formatResume(data, colors);

        try {
            fs.writeFileSync(outputFile, content);
            console.log(`✅ Resume saved to: ${path.resolve(outputFile)}`);
        } catch (error) {
            console.error(`❌ Error saving file: ${error.message}`);
        }
    },

    // Show project links (GitHub repos, live demos) with optional filtering
    links: (data, query) => {
        const section = getSection(data, "project");
        if (!section?.projects) return;

        // Show links for a specific project
        if (query && query !== true && typeof query === "string") {
            const project = section.projects.find(
                (p, i) =>
                    p.name.toLowerCase().includes(query.toLowerCase()) ||
                    (i + 1).toString() === query
            );

            if (project) {
                console.log(`${project.name} Links:`);
                if (project.links?.github) {
                    console.log(`GitHub: ${project.links.github}`);
                }
                if (project.links?.demo) {
                    console.log(`Demo: ${project.links.demo}`);
                }
                if (
                    !project.links ||
                    (!project.links.github && !project.links.demo)
                ) {
                    console.log("No links available for this project");
                }
            } else {
                console.log(
                    `Project "${query}" not found.\nAvailable projects:`
                );
                section.projects.forEach((p, i) =>
                    console.log(`${i + 1}. ${p.name}`)
                );
            }
        } else {
            // Show links for all projects
            section.projects.forEach((proj, i) => {
                console.log(`${i + 1}. ${proj.name}:`);
                if (proj.links?.github) {
                    console.log(`   GitHub: ${proj.links.github}`);
                }
                if (proj.links?.demo) {
                    console.log(`   Demo: ${proj.links.demo}`);
                }
                if (!proj.links || (!proj.links.github && !proj.links.demo)) {
                    console.log("   No links available");
                }
                console.log("");
            });
        }
    },
};

/**
 * Format the complete resume for display in the terminal
 * Converts resume data into a formatted string with colors and sections
 *
 * @param {Object} data - Resume data object
 * @param {Object} colors - Color functions for formatting
 * @returns {String} Formatted resume content
 */
function formatResume(data, colors) {
    const lines = [colors.bold(data.name.toUpperCase()), ""];

    // Add contact information section
    lines.push(colors.bold(colors.blueBright("Contact")));
    if (data.location) lines.push(`Location: ${data.location}`);
    if (data.contact?.email) lines.push(`Email: ${data.contact.email}`);
    if (data.contact?.phone) lines.push(`Phone: ${data.contact.phone}`);
    if (data.contact?.linkedin)
        lines.push(`LinkedIn: ${data.contact.linkedin}`);
    lines.push("");

    // Add other sections
    data.sections?.forEach((section) => {
        lines.push(colors.bold(colors.blueBright(section.title)));

        // Handle different section types
        if (section.items) {
            section.items.forEach((item) => {
                if (item.institution) {
                    lines.push(
                        `${item.institution}${
                            item.location ? " | " + item.location : ""
                        }${item.period ? " (" + item.period + ")" : ""}`
                    );
                    if (item.degree)
                        lines.push(
                            `- ${item.degree}${
                                item.gpa || item.score
                                    ? " • " + (item.gpa || item.score)
                                    : ""
                            }`
                        );
                }
            });
        } else if (section.categories) {
            section.categories.forEach((cat) =>
                lines.push(`${cat.name}: ${cat.skills.join(", ")}`)
            );
        } else if (section.projects) {
            section.projects.forEach((proj) => {
                lines.push(
                    `${proj.name}${proj.subtitle ? " – " + proj.subtitle : ""}${
                        proj.stack ? " | " + proj.stack.join(", ") : ""
                    }`
                );
                proj.highlights?.forEach((h) => lines.push(`- ${h}`));
            });
        } else if (section.achievements) {
            section.achievements.forEach((ach) =>
                lines.push(
                    `- ${ach.name}${ach.date ? " (" + ach.date + ")" : ""}`
                )
            );
        }

        lines.push("");
    });

    return lines.join("\n");
}

/**
 * Main function - orchestrates the entire CLI operation
 * This is where everything comes together: parsing args, loading data, and displaying output
 */
function main() {
    // Set up command line parsing and get user's flags
    const argv = setupCLI();
    const flags = parseFlags(argv);
    const data = loadResumeData();

    // Check if user wants a simple command (like --name or --email)
    // These commands just print specific info and exit
    for (const [command, handler] of Object.entries(simpleCommands)) {
        if (flags[command] !== undefined) {
            handler(data, flags[command]);
            return; // Exit after handling the simple command
        }
    }

    // Handle JSON export requests
    if (flags.json) {
        if (flags.print) return printValue(getByPath(data, flags.print));
        if (flags.jsonPath)
            return console.log(
                JSON.stringify(getByPath(data, flags.jsonPath), null, 2)
            );
        return console.log(JSON.stringify(data, null, 2));
    }

    // Handle JSON Resume schema export
    if (flags.jsonResume) {
        const jsonResume = toJsonResume(data);
        if (flags.printResume)
            return printValue(getByPath(jsonResume, flags.printResume));
        if (flags.jsonResumePath)
            return console.log(
                JSON.stringify(
                    getByPath(jsonResume, flags.jsonResumePath),
                    null,
                    2
                )
            );
        return console.log(JSON.stringify(jsonResume, null, 2));
    }

    // Regular display mode - show the full formatted resume
    const caps = getTerminalCaps(flags);
    const colors = createColors(chalk, caps.color);
    const { contentWidth } = getWidth(flags, caps.cols);

    const content = formatResume(data, colors);

    // Plain mode: just text, no fancy formatting
    if (flags.plain) {
        console.log(content);
        console.log("\n" + colors.gray("Tip: Save output with > resume.txt"));
        return;
    }

    // Fancy mode: ASCII art header + bordered box
    const header = createHeader(data.name, {
        figletLib,
        gradientLib,
        clearLib,
        colors,
        caps,
        flags,
    });
    const boxedContent = createBox(content, {
        boxen,
        unicode: caps.unicode,
        colorSupported: caps.color,
        contentWidth,
    });
    const tip = colors.gray("Tip: Save output with > resume.txt");

    const output = { header, content: boxedContent, tip };

    // Try to use React/Ink for fancy rendering, fallback to simple console output
    if (inkLib && React && App) {
        try {
            const { render } = inkLib;
            render(React.createElement(App.default || App, output));
        } catch {
            // React/Ink failed, use simple console output
            console.log([output.header, output.content, output.tip].join("\n"));
        }
    } else {
        // No React/Ink available, use simple console output
        console.log([output.header, output.content, output.tip].join("\n"));
    }
}

// Start the CLI application
main();
