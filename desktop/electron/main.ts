import { app, BrowserWindow } from "electron";
import path from "node:path";
import { setProjectHandler } from "./handler/projectHandler";
import * as process from "process";
import { setExpectationHandler } from "./handler/expectationHandler";
import { setMatcherHandler } from "./handler/matcherHandler";
import { setActionHandler } from "./handler/actionHandler";

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, "../dist");
process.env.PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

const env = process.env["PROJECT_ENV"];
async function createWindow() {
  await setProjectHandler(app.getPath("appData"));
  await setExpectationHandler(app.getPath("appData"));
  await setMatcherHandler(app.getPath("appData"));
  await setActionHandler(app.getPath("appData"));

  win = new BrowserWindow({
    icon: path.join(process.env.PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (env === "dev") {
    win.loadURL("http://localhost:5173");
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}

app.on("window-all-closed", () => {
  win = null;
});

app.whenReady().then(createWindow);
