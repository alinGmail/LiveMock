import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { setProjectHandler } from "./handler/projectHandler";
import * as process from "process";
import { setExpectationHandler } from "./handler/expectationHandler";
import { setGroupHandler } from "./handler/groupHandler";
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
import { SystemEvents } from "livemock-core/struct/events/desktopEvents";
import log from "electron-log/main";
import { sysEventEmitter } from "./common/eventEmitters";
import { SystemEvent } from "livemock-core/struct/events/systemEvent";
import { addWsEventListeners } from "./common/eventListener";
import { pruneAllProjects, startLogPruneTask } from "./log/logPruneTask";

const env = process.env["PROJECT_ENV"];

// Keep dev data inside the worktree. Without this every worktree (and every
// running dev app) shares ~/.config/Electron, so projects, logs and per-project
// mock ports collide. Production keeps Electron's normal userData location.
if (env === "dev") {
  if (process.env.LIVEMOCK_DEV_SHARED_DATA === "1") {
    console.log(`[desktop-dev] userData: shared (${app.getPath("userData")})`);
  } else {
    const devUserData = process.env.LIVEMOCK_DEV_USER_DATA
      ? path.resolve(process.env.LIVEMOCK_DEV_USER_DATA)
      : path.resolve(__dirname, "../.dev-data");
    const devSessionData = path.join(devUserData, "session");
    fs.mkdirSync(devSessionData, { recursive: true });
    app.setPath("userData", devUserData);
    app.setPath("sessionData", devSessionData);
    console.log(`[desktop-dev] userData: ${devUserData}`);
  }
}

log.initialize();
log.errorHandler.startCatching();

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

sysEventEmitter.on(SystemEvent.START, async () => {
  const systemCollection = await getSystemCollection(app.getPath("userData"));
  const systemConfig = systemCollection.findOne({});
  if (systemConfig) {
  } else {
    systemCollection.insertOne({ version: systemVersion });
  }
});

// trim request logs over each project's configured maximum, once at boot and
// then on a timer
sysEventEmitter.on(SystemEvent.START, async () => {
  const userDataPath = app.getPath("userData");
  try {
    await pruneAllProjects(userDataPath);
  } catch (err) {
    console.error(err);
  }
  startLogPruneTask(userDataPath);
});

addWsEventListeners(app.getPath("userData"));

async function createWindow() {
  buildMenu({
    onAboutClick: () => {
      createAboutWindow();
    },
  });
  await Promise.all(
    sysEventEmitter.listeners(SystemEvent.START).map((listener) => listener())
  );

  await setProjectHandler(app.getPath("userData"));
  await setExpectationHandler(app.getPath("userData"));
  await setGroupHandler(app.getPath("userData"));
  await setMatcherHandler(app.getPath("userData"));
  await setActionHandler(app.getPath("userData"));
  await setLogViewHandler(app.getPath("userData"));
  await setLogFilterHandler(app.getPath("userData"));

  win = new BrowserWindow({
    icon: path.join(process.env.PUBLIC, "logo.png"),
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
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
    const devServerUrl = VITE_DEV_SERVER_URL ?? "http://localhost:5174";
    win.loadURL(devServerUrl);
    win.webContents.on("did-fail-load", () => {
      setTimeout(() => {
        win?.loadURL(devServerUrl);
      }, 3000);
    });
    win.webContents.openDevTools();
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
    const devServerUrl = VITE_DEV_SERVER_URL ?? "http://localhost:5174";
    aboutWin.loadURL(
      `${devServerUrl}/about.html?version=${process.env.npm_package_version}`
    );
  } else {
    aboutWin.loadFile(path.join(process.env.DIST, `about.html`));
  }
  aboutWin.webContents.on("did-finish-load", () => {
    aboutWin.webContents
      .executeJavaScript(
        `
      const ele = document.querySelector("#version");
      ele.innerHTML = '${app.getVersion()}';
    `
      )
      .catch(console.error);
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
