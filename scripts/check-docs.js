const fs = require("node:fs");
const path = require("node:path");

const requiredFiles = [
  "README.md",
  "DEMO_GUIDE.md",
  "INTERVIEW_SCRIPT.md",
  "RELEASE_CHECKLIST.md",
  "docs/DEPLOY.md",
  "docs/perf-baseline.md",
  "docs/MACRO_METRICS.md",
  "robots.txt",
  "sitemap.xml",
  "status.html",
  "docs/architecture.png",
  "docs/screenshots/dashboard.png",
  "docs/screenshots/assets.png",
  "docs/screenshots/risk.png",
  "docs/screenshots/settings.png",
  "docs/screenshots/mobile.png"
];

const missing = requiredFiles.filter(rel => !fs.existsSync(path.join(process.cwd(), rel)));
if (missing.length > 0) {
  console.error("Missing docs/assets:");
  missing.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log("check-docs passed.");
