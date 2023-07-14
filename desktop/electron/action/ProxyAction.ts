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
const inflateAsync = util.promisify(zlib.inflate);
const unzipAsync = util.promisify(zlib.unzip);
const brotliDecompressAsync = util.promisify(zlib.brotliDecompress);

let proxy = httpProxy.createProxyServer({});

proxy.on("proxyReq", function (proxyReq, req, res, options) {
  fixRequestBody(proxyReq, req as express.Request);
  const proxyAction = (options as any).proxyAction as ProxyActionM;
  //
  if (proxyAction.handleCross) {
    // handle cross
    handleOptionsCross(
      req as express.Request,
      res as express.Response,
      proxyAction.crossAllowCredentials
    );
  }
});
proxy.on("proxyRes", function (proxyRes: http.IncomingMessage, req, res) {
  let body: Array<any> = [];
  const recordBody = isRecordBody(req, proxyRes);
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
 *
 * @param req
 * @param res
 * @param crossAllowCredentials
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
 */
function handleRequestCross(
  req: express.Request,
  res: express.Response,
  crossAllowCredentials: boolean
) {
  res.header("Access-Control-Allow-Origin", req.get("Origin"));
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
  res.header("Access-Control-Allow-Headers", headerStr);
  res.header("Access-Control-Allow-Methods", req.method.toUpperCase());
  if (crossAllowCredentials) {
    res.header("Access-Control-Allow-Credentials", "true");
  }
}

export default class ProxyActionImpl implements IAction {
  action: ProxyActionM;
  delay: number;
  constructor(action: ProxyActionM, delay: number) {
    this.action = action;
    this.delay = delay;
  }
  async process(req: express.Request, res: express.Response): Promise<void> {
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
      res.on("end", () => {
        resolve();
      });
      proxy.web(req, res, option);
    });
  }
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
