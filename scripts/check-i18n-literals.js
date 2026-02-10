const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
function collectJsFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectJsFiles(full));
      return;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      out.push(full);
    }
  });
  return out;
}

const targets = [
  "app.js",
  ...collectJsFiles(path.join(root, "js")).map(full => path.relative(root, full))
];

const checks = [
  /showToast\(\s*['"`][^'"`]+['"`]/g,
  /setInlineError\(\s*['"`][^'"`]+['"`]\s*,\s*['"`][^'"`]+['"`]/g
];

const whitelist = [
  "console.error('Import failed'",
  "console.error('Demo load failed'",
  "console.error('Demo restore failed'"
];

const violations = [];
for (const rel of targets) {
  const full = path.join(root, rel);
  const content = fs.readFileSync(full, "utf8");
  checks.forEach(regex => {
    const matches = content.match(regex) || [];
    matches.forEach(hit => {
      if (!whitelist.some(item => hit.includes(item))) {
        violations.push(`${rel}: ${hit}`);
      }
    });
  });
}

if (violations.length > 0) {
  console.error("i18n literal violations found:");
  violations.forEach(v => console.error(`- ${v}`));
  process.exit(1);
}

console.log("check-i18n-literals passed.");
