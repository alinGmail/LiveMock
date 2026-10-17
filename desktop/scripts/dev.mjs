import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const require = createRequire(import.meta.url);
const desktopDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

// "0" asks Vite (and the OS) for a free port, so multiple worktrees and
// multiple dev sessions can run at the same time without coordinating ports.
if (process.env.LIVEMOCK_DESKTOP_PORT === undefined) {
  process.env.LIVEMOCK_DESKTOP_PORT = "0";
}

let server;
let electron;
let shuttingDown = false;

async function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  try {
    electron?.kill("SIGTERM");
  } catch {
    // The process already exited.
  }
  try {
    await server?.close();
  } catch {
    // Vite was never started or already closed.
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", (error) => {
  console.error("[desktop-dev]", error);
  shutdown(1);
});
process.on("unhandledRejection", (error) => {
  console.error("[desktop-dev]", error);
  shutdown(1);
});

try {
  console.log("[desktop-dev] compiling Electron main/preload…");
  execFileSync(
    process.execPath,
    [require.resolve("typescript/bin/tsc"), "-project", "electron"],
    { cwd: desktopDir, stdio: "inherit" }
  );

  server = await createServer({
    root: desktopDir,
    configFile: path.join(desktopDir, "vite.config.ts"),
  });
  await server.listen();

  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("Vite did not expose a TCP address");
  }
  const devServerUrl = `http://localhost:${address.port}`;
  console.log(`[desktop-dev] renderer: ${devServerUrl}`);

  electron = spawn(require("electron"), ["dist-electron/main.js"], {
    cwd: desktopDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PROJECT_ENV: "dev",
      VITE_DEV_SERVER_URL: devServerUrl,
    },
  });
  electron.on("exit", (code) => shutdown(code ?? 0));
  electron.on("error", (error) => {
    console.error("[desktop-dev]", error);
    shutdown(1);
  });
} catch (error) {
  console.error("[desktop-dev] failed to start:", error);
  await shutdown(1);
}
