import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

const backendUrl = `http://localhost:${process.env.LIVEMOCK_PORT || 9002}`;

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  if (command === "serve") {
    return {
      plugins: [svgr(), react(), tsconfigPaths()],
      define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
      },
      server: {
        proxy: {
          "/project": backendUrl,
          "/expectation": backendUrl,
          "/matcher": backendUrl,
          "/action": backendUrl,
          "/log": backendUrl,
          "/logFilter": backendUrl,
          "/socket.io": {
            target: backendUrl,
            ws: true,
          },
        },
      },
    };
  } else {
    return {
      plugins: [svgr(), react(), tsconfigPaths()],
      base: "dashboard",
      define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
      }
    };
  }
});
