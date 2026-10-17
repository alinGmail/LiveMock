import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
// https://vitejs.dev/config/

const requestedPort = Number(process.env.LIVEMOCK_DESKTOP_PORT ?? 5174);
const devPort =
  Number.isFinite(requestedPort) && requestedPort >= 0 ? requestedPort : 5174;

export default defineConfig({
  // The dev orchestrator sets LIVEMOCK_DESKTOP_PORT=0 to get an OS-assigned
  // free port, so concurrent worktrees never fight over a fixed port. Manual
  // `vite` runs keep the dedicated 5174 default.
  server: {
    port: devPort,
    strictPort: devPort !== 0,
  },
  plugins: [
    svgr(),
    react(),
    tsconfigPaths(),
/*
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: "electron/main.ts",
        vite: {
          build: {
            minify: false,
          },
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          options.reload();
        },
        vite: {
          build: {
            minify: false,
          },
        },
      },
    ]),
*/
    //renderer(),
  ],
  base:"./"
});
