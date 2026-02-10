import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("orchestrator split scaffolding", () => {
  it("loads orchestrator helper modules in index.html", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toContain("js/orchestrator/data-bootstrap.js");
    expect(html).toContain("js/orchestrator/view-routes.js");
    expect(html).toContain("js/orchestrator/feature-wiring.js");
    expect(html).toContain("js/orchestrator/refresh-jobs.js");
  });

  it("registers global orchestrator module factories", () => {
    globalThis.window = {};
    const files = [
      "js/orchestrator/data-bootstrap.js",
      "js/orchestrator/view-routes.js",
      "js/orchestrator/feature-wiring.js",
      "js/orchestrator/refresh-jobs.js"
    ];

    files.forEach(file => {
      const code = readFileSync(resolve(process.cwd(), file), "utf8");
      // eslint-disable-next-line no-eval
      eval(code);
    });

    expect(typeof window.AppOrchestratorDataBootstrap?.createDataBootstrap).toBe("function");
    expect(typeof window.AppOrchestratorViewRoutes?.createViewRoutes).toBe("function");
    expect(typeof window.AppOrchestratorFeatureWiring?.createFeatureWiring).toBe("function");
    expect(typeof window.AppOrchestratorRefreshJobs?.createRefreshJobs).toBe("function");
  });
});
