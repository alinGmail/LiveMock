import { IAction, ProxyActionM } from "core/struct/action";
import express from "express";
import {delayPromise} from "./common";
import * as zlib from "zlib";
const util = require("util");
import httpProxy from "http-proxy"
import {fixRequestBody} from "./fixRequestBody";
import * as http from "http";
import {isRecordBody} from "../util/bodyParseUtil";
const inflateAsync = util.promisify(zlib.inflate);
const unzipAsync = util.promisify(zlib.unzip);
const brotliDecompressAsync = util.promisify(zlib.brotliDecompress);


let proxy = httpProxy.createProxyServer({});

proxy.on("proxyReq", function (proxyReq, req, res ) {
  fixRequestBody(proxyReq, req as express.Request);
});
proxy.on(
    "proxyRes",
    function (proxyRes: http.IncomingMessage, req, res) {
      let body: Array<any> = [];
      const recordBody = isRecordBody(proxyRes);
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
          // const respObj = new ResponseLogImpl(res, bodyStr);
        })();
      });
    }
);

class ProxyAction implements IAction {
  action: ProxyActionM;
  delay: number;
  constructor(action: ProxyActionM, delay: number) {
    this.action = action;
    this.delay = delay;
  }
  async process(req: express.Request, res: express.Response): Promise<void> {
    if (this.delay > 0) {
      await delayPromise(this.delay);
    }

    let option = {
      changeOrigin: true,
      target: `${this.action.host}`,
      selfHandleResponse: false,
    };
    proxy.web(req, res, option);

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
