const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    include: ["tests/**/*.vitest.test.js"],
    environment: "node"
  }
});
