import pino from "pino";
import { LogM } from "core/struct/log";
import express from "express";
import ws from "ws";
import { ProxyActionM } from "core/struct/action";

export function handleSubProtocol(secProtocol: string | null | undefined) {
  if (secProtocol) {
    const protocolArr = secProtocol.split(",").map((item) => item.trim());
    return protocolArr;
  } else {
    return undefined;
  }
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
  });

  wss.on("error", (err) => {
    wsc.close();
  });
  wss.on("close", () => {
    wsc.close();
  });

  const wsc = new ws.WebSocket(`ws://${action.host}`, protocolArray);
  wsc.on("message", (message, isBinary) => {
    wss.clients.forEach((client) => {
      client.send(message.toString("utf8"));
    });
  });
  wsc.on("error", (err) => {
    wss.close();
  });
  wsc.on("close", () => {
    wss.close();
  });

  wsc.on("open", () => {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit("connection", ws, req);
    });
  });
}
