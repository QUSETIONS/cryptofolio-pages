const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const TARGET_DIRS = ["js", "api", "scripts"];
const TARGET_FILES = ["app.js", "index.html", "status.html", "open.html"];
const ALLOWED_MUSTACHE_FILES = new Set([
  path.join("js", "i18n", "messages.en.js"),
  path.join("js", "i18n", "messages.zh.js")
]);

const suspiciousMojibakePatterns = [
  /鏂伴椈|鍒锋柊|鑾峰彇|澶辫触|璇疯缃|褰撳墠|涓汉鍔犲瘑|閰嶇疆涓庡父閲/,
  /锛|銆|鈥|鈩|锟/
];

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      return;
    }
    if (/\.(js|html|json)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  });
  return files;
}

function collectTargets() {
  const files = [];
  TARGET_DIRS.forEach(dir => {
    files.push(...walkFiles(path.join(ROOT, dir)));
  });
  TARGET_FILES.forEach(file => {
    const fullPath = path.join(ROOT, file);
    if (fs.existsSync(fullPath)) files.push(fullPath);
  });
  return [...new Set(files)];
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function checkFile(filePath, violations) {
  const content = fs.readFileSync(filePath, "utf8");
  const normalizedPath = rel(filePath);
  if (normalizedPath === "scripts/check-log-text-health.js") {
    return;
  }
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNo = index + 1;

    if (/`r`n/.test(line) || /\\x[0-9A-Fa-f]{2}/.test(line)) {
      violations.push(`${normalizedPath}:${lineNo} suspicious escape sequence`);
    }

    const likelyRuntimeLiteral = /(console\.(error|warn|log)\(|showToast\(|setInlineError\(|textContent\s*=|innerHTML\s*=|title:\s*['"`])/;
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) {
      return;
    }

    if (line.includes("{{") && line.includes("}}") && !ALLOWED_MUSTACHE_FILES.has(normalizedPath) && likelyRuntimeLiteral.test(line)) {
      violations.push(`${normalizedPath}:${lineNo} unreplaced template placeholder detected`);
    }

    if (likelyRuntimeLiteral.test(line)) {
      suspiciousMojibakePatterns.forEach((pattern, patternIndex) => {
        if (pattern.test(line)) {
          violations.push(`${normalizedPath}:${lineNo} suspicious runtime text pattern #${patternIndex + 1}`);
        }
      });
    }
  });
}

function collectViolations() {
  const violations = [];
  const targets = collectTargets();
  targets.forEach(filePath => checkFile(filePath, violations));
  return violations;
}

function main() {
  const violations = collectViolations();
  if (violations.length > 0) {
    console.error("check-log-text-health failed:");
    violations.slice(0, 100).forEach(item => console.error(`- ${item}`));
    if (violations.length > 100) {
      console.error(`...and ${violations.length - 100} more`);
    }
    process.exit(1);
  }

  console.log("check-log-text-health passed.");
}

if (require.main === module) {
  main();
}

module.exports = {
  collectViolations
};
