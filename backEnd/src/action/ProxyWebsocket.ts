import {
  createWebsocketInfo,
  LogM,
  WebsocketStatus,
  WebsocketMessageM,
} from "core/struct/log";
import express from "express";
import ws from "ws";
import { ProxyActionM } from "core/struct/action";
import * as console from "console";
import { websocketEventEmitter } from "../common/eventEmitters";
import { WebsocketEvent } from "core/struct/events/systemEvent";

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
  projectId: string,
  req: express.Request,
  res: express.Response,
  logM: LogM | undefined,
  action: ProxyActionM,
  logCollection: Collection<LogM>
) {
  // handle websocket
  const secProtocol = req.headers["sec-websocket-protocol"];
  const protocolArray = handleSubProtocol(secProtocol);
  const wss = new ws.WebSocketServer({ noServer: true });
  // log websocket info
  if (logM) {
    logM.websocketInfo = createWebsocketInfo();
    logM.websocketInfo.isWebsocket = true;
    logCollection.update(logM);
  }

  wss.on("connection", (ws) => {
    websocketEventEmitter.emit(
      WebsocketEvent.CONNECTION,
      projectId,
      wss,
      wsc,
      logM
    );
    if (logM && logM.websocketInfo) {
      logM.websocketInfo.status = WebsocketStatus.OPEN;
      logCollection.update(logM);
    }
    ws.on("message", (message, isBinary) => {
      const websocketMessageItem: WebsocketMessageM = {
        sendTime: new Date().getTime(),
        sendFromClient: true,
        isBinary: isBinary,
        content: isBinary ? "" : message.toString("utf8"),
        exceededMaxLength: false,
      };
      if (logM) {
        logM.websocketInfo?.messages.push(websocketMessageItem);
        logCollection.update(logM);
      }
      if (isBinary) {
        wsc.send(message);
      } else {
        wsc.send(message.toString("utf8"));
      }
    });
    ws.on("close", () => {
      wsc.close();
    });
    ws.on("error", () => {
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
    const websocketMessageItem: WebsocketMessageM = {
      sendTime: new Date().getTime(),
      sendFromClient: false,
      isBinary: isBinary,
      content: isBinary ? "" : message.toString("utf8"),
      exceededMaxLength: false,
    };
    if (logM) {
      logM.websocketInfo?.messages.push(websocketMessageItem);
      logCollection.update(logM);
    }

    wss.clients.forEach((client) => {
      if (isBinary) {
        client.send(message);
      } else {
        client.send(message.toString("utf8"));
      }
    });
  });
  wsc.on("error", (err) => {
    wss.close();
  });
  wsc.on("close", () => {
    if (logM && logM.websocketInfo) {
      logM.websocketInfo.status = WebsocketStatus.CLOSED;
      logCollection.update(logM);
    }

    wss.clients.forEach((client) => {
      client.close();
    });
    wss.close((error) => {
      if (error) {
        console.error(error);
      }
    });
    websocketEventEmitter.emit(
      WebsocketEvent.CLOSED,
      projectId,
      wss,
      wsc,
      logM
    );
  });

  wsc.on("open", () => {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit("connection", ws, req);
    });
  });
}
