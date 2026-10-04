import express from "express";
import util from "util";
import { IAction, StaticDirectoryActionM } from "livemock-core/struct/action";
import { LogM } from "livemock-core/struct/log";

function delay(t, cb) {
  setTimeout(function () {
    let err: null | Error = null;
    cb(err, "Success");
  }, t);
}

let delayPromise = util.promisify(delay);

// one express.static middleware per configured folder, reused across requests
const staticMiddlewareCache = new Map<string, express.RequestHandler>();

function getStaticMiddleware(folderPath: string): express.RequestHandler {
  let middleware = staticMiddlewareCache.get(folderPath);
  if (!middleware) {
    middleware = express.static(folderPath);
    staticMiddlewareCache.set(folderPath, middleware);
  }
  return middleware;
}

/**
 * empty or "/" means no stripping; otherwise a leading "/" is ensured and
 * trailing slashes removed
 */
function normalizePrefix(urlPrefix: string | null | undefined): string {
  if (typeof urlPrefix !== "string") {
    return "";
  }
  const trimmed = urlPrefix.trim();
  if (trimmed === "" || trimmed === "/") {
    return "";
  }
  let prefix = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  while (prefix.length > 1 && prefix.endsWith("/")) {
    prefix = prefix.slice(0, -1);
  }
  return prefix;
}

class StaticDirectoryActionImpl implements IAction {
  action: StaticDirectoryActionM;
  delay: number;

  constructor(action: StaticDirectoryActionM, delay: number) {
    this.action = action;
    this.delay = delay;
  }

  async process(
    projectId: string,
    req: express.Request,
    res: express.Response,
    logM: LogM | undefined
  ): Promise<void> {
    if (this.delay > 0) {
      await delayPromise(this.delay);
    }
    insertProxyInfo(logM);

    const folderPath =
      typeof this.action.folderPath === "string"
        ? this.action.folderPath.trim()
        : "";
    if (folderPath === "") {
      notFound(res);
      return;
    }

    const prefix = normalizePrefix(this.action.urlPrefix);
    const pathname = req.path;
    let staticPath: string;
    if (prefix === "") {
      staticPath = pathname;
    } else if (pathname === prefix) {
      staticPath = "/";
    } else if (pathname.startsWith(`${prefix}/`)) {
      staticPath = pathname.slice(prefix.length);
    } else {
      notFound(res);
      return;
    }

    const queryIndex = req.url.indexOf("?");
    const search = queryIndex === -1 ? "" : req.url.slice(queryIndex);
    const originalUrl = req.url;
    const originalOriginalUrl = req.originalUrl;
    req.url = staticPath + search;
    // express.static mounts a directory at the prefix without a trailing slash
    // by redirecting; at the prefix root we serve the index directly instead
    if (prefix !== "" && staticPath === "/") {
      req.originalUrl = `/${search}`;
    }

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        res.off("finish", finish);
        res.off("close", finish);
        req.url = originalUrl;
        req.originalUrl = originalOriginalUrl;
        resolve();
      };
      res.on("finish", finish);
      res.on("close", finish);
      getStaticMiddleware(folderPath)(req, res, () => {
        notFound(res);
        finish();
      });
    });
  }
}

function notFound(res: express.Response) {
  if (!res.headersSent) {
    res.status(404).send("Not Found");
  }
}

function insertProxyInfo(log: LogM | undefined) {
  if (!log) {
    return;
  }
  log.proxyInfo = {
    isProxy: false,
    proxyHost: null,
    proxyPath: null,
    requestHeaders: [],
    responseHeaders: [],
  };
}

export { StaticDirectoryActionImpl };
