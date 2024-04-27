import { app, BrowserWindow } from "electron";
import path from "node:path";
import { setProjectHandler } from "./handler/projectHandler";
import * as process from "process";
import { setExpectationHandler } from "./handler/expectationHandler";
import { setMatcherHandler } from "./handler/matcherHandler";
import { setActionHandler } from "./handler/actionHandler";
import {
  logViewEventHandler,
  setLogViewHandler,
} from "./handler/logViewHandler";
import { setLogFilterHandler } from "./handler/logFilterHandler";
import { buildMenu } from "./buildMenu";
import { getSystemCollection } from "./db/dbManager";
import { systemVersion } from "./config";
import * as electron from "electron";
import ipcMain = electron.ipcMain;
import { SystemEvents } from "core/struct/events/desktopEvents";
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

async function projectInit() {
  const systemCollection = await getSystemCollection(app.getPath("userData"));
  const systemConfig = systemCollection.findOne({});
  if (systemConfig) {
  } else {
    systemCollection.insertOne({ version: systemVersion });
  }
}

async function createWindow() {
  buildMenu({
    onAboutClick: () => {
      createAboutWindow();
    },
  });
  await projectInit();
  await setProjectHandler(app.getPath("userData"));
  await setExpectationHandler(app.getPath("userData"));
  await setMatcherHandler(app.getPath("userData"));
  await setActionHandler(app.getPath("userData"));
  await setLogViewHandler(app.getPath("userData"));
  await setLogFilterHandler(app.getPath("userData"));

  win = new BrowserWindow({
    icon: path.join(process.env.PUBLIC, "logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    logViewEventHandler(win!.webContents);
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (env === "dev") {
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}

function createAboutWindow() {
  if (!win) {
    return;
  }
  const aboutWin = new BrowserWindow({
    parent: win,
    modal: true,
    show: true,
    width: 300,
    height: 300,
    autoHideMenuBar: true,
  });
  if (env === "dev") {
    aboutWin.loadURL(
      `http://localhost:5173/about.html?version=${process.env.npm_package_version}`
    );
  } else {
    aboutWin.loadFile(path.join(process.env.DIST, `about.html`));
  }
  aboutWin.webContents.openDevTools();
  aboutWin.webContents.on("did-finish-load", () => {
    aboutWin.webContents.executeJavaScript(`
      const ele = document.querySelector("#version");
      ele.innerHTML = '${process.env.npm_package_version}';
    `).catch(console.error);
  });
}

ipcMain.handle(SystemEvents.OpenAboutWindow, () => {
  createAboutWindow();
});

app.on("window-all-closed", () => {
  win = null;
  app.quit();
});

app.whenReady().then(createWindow);
