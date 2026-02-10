const { spawnSync } = require("node:child_process");

function readBaseUrlFromArgs() {
  const index = process.argv.indexOf("--base-url");
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return process.env.PUBLIC_BASE_URL || "";
}

function run(command, env = process.env) {
  const result = spawnSync(command, {
    stdio: "inherit",
    shell: true,
    env
  });
  if (result.status !== 0) {
    console.error(`Command failed: ${command}`);
    process.exit(result.status || 1);
  }
}

function main() {
  const baseUrl = readBaseUrlFromArgs();
  if (!baseUrl) {
    console.error("Missing base URL. Use --base-url <url> or set PUBLIC_BASE_URL.");
    process.exit(1);
  }

  run(`node scripts/check-public-endpoints.js --base-url "${baseUrl}"`);
  run("npm run test:e2e:deploy-smoke", {
    ...process.env,
    PUBLIC_BASE_URL: baseUrl
  });

  console.log(`release-verify passed for ${baseUrl}`);
}

main();
