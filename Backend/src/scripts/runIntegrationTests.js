const { spawnSync } = require("node:child_process");
const result = spawnSync(process.execPath, ["--test", "test/integration.test.js"], {
  stdio: "inherit",
  env: { ...process.env, RUN_DB_TESTS: "1" },
});
process.exit(result.status ?? 1);
