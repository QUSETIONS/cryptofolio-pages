const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const START_DATE = new Date("2026-02-15T00:00:00");
const TOTAL_DAYS = 14;
const ROOT = path.resolve(__dirname, "..");
const DELIVERABLE_DIR = path.join(ROOT, "docs", "interview-prep", "deliverables");

function getDayFromDate(date = new Date()) {
  const diffMs = date.getTime() - START_DATE.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  if (diffDays < 1) return 1;
  if (diffDays > TOTAL_DAYS) return TOTAL_DAYS;
  return diffDays;
}

function parseChecklist(md) {
  const lines = md.split(/\r?\n/);
  const checks = lines.filter((line) => /^- \[[ xX]\]/.test(line.trim()));
  const done = checks.filter((line) => /^- \[[xX]\]/.test(line.trim()));
  return { total: checks.length, done: done.length };
}

function dayFile(day) {
  const dayText = String(day).padStart(2, "0");
  return path.join(DELIVERABLE_DIR, `day-${dayText}.md`);
}

function summarizeAllDays() {
  let completedDays = 0;
  let totalChecks = 0;
  let doneChecks = 0;
  const rows = [];

  for (let day = 1; day <= TOTAL_DAYS; day += 1) {
    const file = dayFile(day);
    if (!fs.existsSync(file)) {
      rows.push({ day, status: "missing", checks: "0/0" });
      continue;
    }

    const md = fs.readFileSync(file, "utf8");
    const parsed = parseChecklist(md);
    totalChecks += parsed.total;
    doneChecks += parsed.done;

    const isDone = parsed.total > 0 && parsed.done === parsed.total;
    if (isDone) completedDays += 1;
    rows.push({
      day,
      status: isDone ? "done" : "in_progress",
      checks: `${parsed.done}/${parsed.total}`
    });
  }

  return { completedDays, totalChecks, doneChecks, rows };
}

function runCommand(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: "inherit", cwd: ROOT });
}

function printHelp() {
  console.log("Usage: node scripts/interview-prep-status.js [--today] [--run-demo] [--help]");
  console.log("  --today     show the current sprint day number based on 2026-02-15");
  console.log("  --run-demo  run Day 1 demo commands");
}

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help")) {
    printHelp();
    return;
  }

  const summary = summarizeAllDays();
  console.log("Interview Prep Progress");
  console.log("=======================");
  console.log(`Completed days: ${summary.completedDays}/${TOTAL_DAYS}`);
  console.log(`Checklist checks: ${summary.doneChecks}/${summary.totalChecks}`);
  console.log("");
  summary.rows.forEach((row) => {
    console.log(`Day ${String(row.day).padStart(2, "0")}: ${row.status} (${row.checks})`);
  });

  if (args.has("--today")) {
    const todayDay = getDayFromDate(new Date());
    console.log(`\nToday maps to sprint Day ${String(todayDay).padStart(2, "0")}.`);
    console.log(`Deliverable file: ${path.relative(ROOT, dayFile(todayDay))}`);
  }

  if (args.has("--run-demo")) {
    runCommand("npm run test:e2e:smoke");
    runCommand("npm run test:e2e:strategy-stress-attribution");
  }
}

main();

