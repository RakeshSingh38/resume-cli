# 📄 Rakesh's Resume CLI

> Interactive terminal resume - Clean, fast, and developer-friendly!
> 
> [![npm version](https://badge.fury.io/js/rakeshsingh.svg)](https://www.npmjs.com/package/rakeshsingh)

## 🚀 Quick Start

```bash
# Run instantly
npx rakeshsingh

# Or install globally
npm install -g rakeshsingh
```

## 🎯 Commands

### Basic Info

-   `--name`, `--email`, `--phone`, `--location` - Contact details
-   `--contact` - All contact info (email, phone, LinkedIn, GitHub, Portfolio, LeetCode)
-   `--skills` - Technical skills
-   `--projects [name]` - Projects with full details including links (filter by name/number)
-   `--education` - Education background
-   `--achievements` - Certifications and achievements

### Links

-   `--portfolio` - Portfolio website
-   `--github` - GitHub profile
-   `--download` - Resume download link
-   `--links [project]` - Project links

### Export

-   `--save [filename]` - Save to text file
-   `--json` - Export as JSON
-   `--plain` - Simple text output

## 📖 Examples

```bash
# View full resume
npx rakeshsingh

# Get contact info
npx rakeshsingh --contact
npx rakeshsingh --email

# View projects
npx rakeshsingh --projects
npx rakeshsingh --projects 1
npx rakeshsingh --projects Timeline

# View achievements
npx rakeshsingh --achievements

# Get links
npx rakeshsingh --portfolio
npx rakeshsingh --github
npx rakeshsingh --download

# Save resume
npx rakeshsingh --save
npx rakeshsingh --save my-resume.txt

# Export as JSON
npx rakeshsingh --json > resume.json
```

## ℹ️ Help

```bash
# See all available commands
npx rakeshsingh --help
```

## 🤝 Connect with Rakesh

-   **🌐 Portfolio:** [iamrakesh.codes](https://iamrakesh.codes)
-   **📧 Email:** rakeshsinghtcp@gmail.com
-   **📍 Location:** Mumbai, India

## 📝 License

MIT © [Rakesh Ramkishor Singh](https://iamrakesh.codes)
