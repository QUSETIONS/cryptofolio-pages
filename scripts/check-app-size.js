const fs = require("node:fs");
const path = require("node:path");

const targets = [
  { file: "app.js", max: 900 },
  { file: path.join("js", "app-orchestrator.js"), max: 3200 }
];

const failures = [];
targets.forEach(target => {
  const fullPath = path.join(process.cwd(), target.file);
  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/).length;
  if (lines > target.max) {
    failures.push(`${target.file} line count ${lines} exceeds ${target.max}`);
  } else {
    console.log(`check-app-size ${target.file} passed (${lines}/${target.max}).`);
  }
});

if (failures.length > 0) {
  failures.forEach(message => console.error(message));
  process.exit(1);
}
