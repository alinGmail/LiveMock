import { build } from "esbuild";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const pkg = require("../package.json");

// Runtime dependencies stay external (npm installs them); the internal
// `livemock-core` workspace package is inlined instead of being published.
const runtimeDeps = Object.keys(pkg.dependencies || {});
const external = runtimeDeps.filter((dep) => dep !== "livemock-core");

await build({
  entryPoints: [path.join(root, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: path.join(root, "dist/index.js"),
  external,
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "info",
});

// Ship the built UI next to the bundle; index.ts serves it from
// `path.join(__dirname, "dashboard")`.
const dashboardSrc = path.resolve(root, "../frontEnd/dist");
const dashboardOut = path.join(root, "dist/dashboard");
if (!fs.existsSync(dashboardSrc)) {
  throw new Error(
    `frontend build not found at ${dashboardSrc}; run "yarn web-build" first`
  );
}
fs.rmSync(dashboardOut, { recursive: true, force: true });
fs.cpSync(dashboardSrc, dashboardOut, { recursive: true });
console.log(`bundled -> dist/index.js, dashboard -> dist/dashboard`);
