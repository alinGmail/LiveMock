import { LogM } from "core/struct/log";
import express from "express";
import ws from "ws";
import { ProxyActionM } from "core/struct/action";
import * as console from "console";

export function handleSubProtocol(secProtocol: string | null | undefined) {
  if (secProtocol) {
    const protocolArr = secProtocol.split(",").map((item) => item.trim());
    return protocolArr;
  } else {
    return undefined;
  }
}

const exclude_headers = [
  "upgrade",
  "connection",
  "sec-websocket-key",
  "sec-websocket-version",
  "sec-websocket-protocol",
  "sec-websocket-extensions",
  "host",
];
export function exclude_ws_relative_header(rawHeaders: Array<string>): {
  [key: string]: string;
} {
  const headerMap = {};
  rawHeaders.forEach((value, index) => {
    if (index % 2 === 0) {
      if (!exclude_headers.includes(value.toLowerCase())) {
        headerMap[value] = rawHeaders[index + 1];
      }
    }
  });
  return headerMap;
}

export function handleWebsocketProxy(
  req: express.Request,
  res: express.Response,
  logM: LogM | undefined,
  action: ProxyActionM
) {
  // handle websocket
  const secProtocol = req.headers["sec-websocket-protocol"];
  const protocolArray = handleSubProtocol(secProtocol);
  const wss = new ws.WebSocketServer({ noServer: true });

  wss.on("connection", (ws) => {
    ws.on("message", (message, isBinary) => {
      wsc.send(message.toString("utf8"));
    });
    ws.on("close", () => {
      wsc.close();
    });
  });

  wss.on("error", (err) => {
    wsc.close();
  });
  wss.on("close", () => {
    wsc.close();
  });
  const send_header = exclude_ws_relative_header(req.rawHeaders);
  let url = req.url;
  if (action.prefixRemove && req.url.startsWith(action.prefixRemove)) {
    url = req.url.slice(action.prefixRemove.length);
  }
  const wsc = new ws.WebSocket(`ws://${action.host}${req.url}`, protocolArray, {
    headers: send_header,
  });
  wsc.on("message", (message, isBinary) => {
    wss.clients.forEach((client) => {
      client.send(message.toString("utf8"));
    });
  });
  wsc.on("error", (err) => {
    wss.close();
  });
  wsc.on("close", () => {
    wss.clients.forEach((client) => {
      client.close();
    });
    wss.close((error) => {
      if (error) {
        console.error(error);
      }
    });
  });

  wsc.on("open", () => {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit("connection", ws, req);
    });
  });
}
