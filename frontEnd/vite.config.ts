import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  if (command === "serve") {
    return {
      plugins: [svgr(), react(), tsconfigPaths()],
      define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
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
