import { IAction, ProxyActionM } from "core/struct/action";
import express from "express";
import { delayPromise } from "./common";
import * as zlib from "zlib";
const util = require("util");
import httpProxy from "http-proxy";
import { fixRequestBody } from "./fixRequestBody";
import * as http from "http";
import { isRecordBody } from "../util/bodyParseUtil";
import typeis from "type-is";
import { LogM } from "core/struct/log";

const inflateAsync = util.promisify(zlib.inflate);
const unzipAsync = util.promisify(zlib.unzip);
const brotliDecompressAsync = util.promisify(zlib.brotliDecompress);

let proxy = httpProxy.createProxyServer({});

proxy.on("proxyReq", function (proxyReq, req, res, options) {
  // handle prefix remove
  const proxyAction: ProxyActionM = (options as any).proxyAction;
  if (
    proxyAction.prefixRemove &&
    proxyReq.path.startsWith(proxyAction.prefixRemove)
  ) {
    proxyReq.path = proxyReq.path.slice(proxyAction.prefixRemove.length);
  }

  // handle request headers
  if (proxyAction.requestHeaders && proxyAction.requestHeaders.length > 0) {
    proxyAction.requestHeaders.forEach(([headerName, headerValue]) => {
      // ignore the blank header name
      if(headerName.trim() === ''){
        return;
      }
      proxyReq.setHeader(headerName, headerValue);
    });
  }

  fixRequestBody(proxyReq, req as express.Request);
});

proxy.on("proxyRes", function (proxyRes: http.IncomingMessage, req, res) {
  let body: Array<any> = [];
  const recordBody = isRecordBody(req, proxyRes);
  const proxyAction = (req as any).proxyAction as ProxyActionM;
  // handle cross`
  if (proxyAction.handleCross) {
    // handle cross
    handleRequestCross(
      req as express.Request,
      proxyRes,
      proxyAction.crossAllowCredentials
    );
  }
  // handle the external headers
  if (proxyAction.headers && proxyAction.headers.length > 0) {
    handleExternalHeaders(
      req as express.Request,
      proxyRes,
      proxyAction.headers
    );
  }
  proxyRes.on("data", function (chunk) {
    if (recordBody) {
      body.push(chunk);
    }
  });
  proxyRes.on("end", function () {
    (async function () {
      let bodyRes = Buffer.concat(body);
      let bodyStr = "";
      if (recordBody) {
        const buffer = await decompress(
          bodyRes,
          proxyRes.headers["content-encoding"]
        );
        bodyStr = buffer.toString();
      }
      (res as any).rawBody = bodyStr;
      const contentType = res.getHeader("content-type");
      const accept = req.headers["accept"];
      if (
        (typeof contentType === "string" && typeis.is(contentType, ["json"])) ||
        (accept && typeis.is(accept, ["json"]))
      ) {
        try {
          (res as any).body = JSON.parse(bodyStr);
        } catch (e) {}
      } else {
        (res as any).body = bodyStr;
      }
      (res as any).rawBody = bodyStr;
      res.emit("end");
      // const respObj = new ResponseLogImpl(res, bodyStr);
    })();
  });
});

function handleOptionsCross(
  req: express.Request,
  res: express.Response,
  crossAllowCredentials: boolean
) {
  res.header("Access-Control-Allow-Origin", req.get("Origin"));
  res.header(
    "Access-Control-Allow-Headers",
    req.get("Access-Control-Request-Headers")
  );
  res.header(
    "Access-Control-Allow-Methods",
    req.get("Access-Control-Request-Method")
  );
  if (crossAllowCredentials) {
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.status(200);
  res.end();
}

/**
 * handle response headers
 * @param req
 * @param res
 * @param headers
 */
function handleExternalHeaders(
  req: express.Request,
  res: http.IncomingMessage,
  headers: Array<[string, string]>
) {
  headers.forEach((item) => {
    // ignore the empty header
    if(item[0].trim() === ''){
      return;
    }
    res.headers[item[0].toLowerCase()] = item[1];
  });
}

/**
 *
 * @param req
 * @param res
 * @param crossAllowCredentials
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
 */
function handleRequestCross(
  req: express.Request,
  res: http.IncomingMessage,
  crossAllowCredentials: boolean
) {
  res.headers["Access-Control-Allow-Origin".toLowerCase()] = req.get("Origin");
  const headerKeySet = new Set<string>();
  req.rawHeaders.forEach((item, index) => {
    if (index % 2 === 0) {
      headerKeySet.add(item.toLowerCase());
    }
  });
  let headerArray: Array<String> = [];
  headerKeySet.forEach((item) => {
    headerArray.push(item);
  });
  const headerStr = headerArray.join(",");
  res.headers["Access-Control-Allow-Headers"] = headerStr;
  res.headers["Access-Control-Allow-Methods"] = req.method.toUpperCase();
  if (crossAllowCredentials) {
    res.headers["Access-Control-Allow-Credentials"] = "true";
  }
}

export default class ProxyActionImpl implements IAction {
  action: ProxyActionM;
  delay: number;
  constructor(action: ProxyActionM, delay: number) {
    this.action = action;
    this.delay = delay;
  }
  async process(
    req: express.Request,
    res: express.Response,
    logM: LogM | undefined
  ): Promise<void> {
    // handle cross
    if (this.action.handleCross && req.method.toUpperCase() === "OPTIONS") {
      return handleOptionsCross(req, res, this.action.crossAllowCredentials);
    }
    if (this.delay > 0) {
      await delayPromise(this.delay);
    }
    return new Promise((resolve, reject) => {
      let option = {
        changeOrigin: true,
        target: `${this.action.protocol}://${this.action.host}`,
        selfHandleResponse: false,
        callback: (error) => {
          if (error) {
            reject(error);
          }
        },
        proxyAction: this.action,
      };
      (req as any).proxyAction = this.action;
      res.on("end", () => {
        resolve();
      });
      insetProxyInfo(logM, option.target, req.path, this.action);
      proxy.web(req, res, option);
    });
  }
}

function insetProxyInfo(
  logM: LogM | undefined,
  proxyHost: string,
  proxyPath: string,
  proxyAction: ProxyActionM
) {
  let _proxyPath = proxyPath;
  if (!logM) {
    return;
  }
  if (
    proxyAction.prefixRemove &&
    proxyPath.startsWith(proxyAction.prefixRemove)
  ) {
    _proxyPath = _proxyPath.slice(proxyAction.prefixRemove.length);
  }
  logM.proxyInfo = {
    isProxy: true,
    proxyHost,
    proxyPath: _proxyPath,
    requestHeaders: proxyAction.requestHeaders?.map(([name, value]) => ({
      name,
      value,
    })),
    responseHeaders: proxyAction.headers?.map(([name, value]) => ({
      name,
      value,
    })),
  };
}

async function decompress(
  buffer: Buffer,
  contentEncoding: string | undefined
): Promise<Buffer> {
  switch (contentEncoding) {
    case "gzip":
      return await unzipAsync(buffer);
    case "br":
      return await brotliDecompressAsync(buffer);
    case "deflate":
      return await inflateAsync(buffer);
    default:
      return buffer;
  }
}
