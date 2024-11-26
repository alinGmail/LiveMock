import http from "http";
import { createServer, IncomingHttpHeaders } from "http";
import express from "express";
import { getLocal } from "mockttp";
import { getBaseEnvProject, setUpBaseEnv } from "../controller/baseEnv";
import { createExpectation } from "livemock-core/struct/expectation";
import { createProxyAction } from "livemock-core/struct/action";
import { createPathMatcher, MatcherCondition } from "livemock-core/struct/matcher";
import { expectationCreation } from "../controller/common";
import getMockRouter from "../../src/server/mockServer";
import { WebSocket, Server } from "ws";
import { checkValueChange } from "../common";
import * as console from "console";

const welcomeStr = "welcome to the Websocket Server";

let secProtocol: string | undefined = "";
let connectPath: string | undefined = "";
let connectHeaders: IncomingHttpHeaders = {};

function setUpWebSocketServer(): Server {
  const server = createServer();
  const wss = new WebSocket.Server({
    noServer: true,
  });

  wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message, isBinary) {
      if (isBinary) {
        ws.send(message);
      } else {
        ws.send("receive :" + message.toString("utf8"));
      }
    });
    ws.send(welcomeStr);
  });

  server.on("upgrade", function upgrade(request, socket, head) {
    secProtocol = request.headers["sec-websocket-protocol"];
    connectPath = request.url;
    connectHeaders = request.headers;
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  server.listen(8085);

  return wss;
}

describe("test websocket proxy", () => {
  const projectM = getBaseEnvProject();
  const server = express();
  const proxyServer = express();
  const mockServer = getLocal();
  const expectationM = createExpectation();
  const proxyActionM = createProxyAction();
  const wss = setUpWebSocketServer();

  beforeAll(async () => {
    await setUpBaseEnv(server);

    const pathMatcherM = createPathMatcher();
    pathMatcherM.conditions = MatcherCondition.START_WITH;
    pathMatcherM.value = "";
    expectationM.matchers = [pathMatcherM];
    expectationM.activate = true;
    expectationM.priority = 1;
    proxyActionM.host = "localhost:8085";
    proxyActionM.prefixRemove = "/api";
    expectationM.actions.push(proxyActionM);

    await expectationCreation(server, projectM, expectationM);

    proxyServer.all("*", await getMockRouter("test_db", projectM.id));


    const http_server = http.createServer(proxyServer);
    http_server.on("upgrade", async (req, socket, head) => {
      const res_dummy = new http.ServerResponse(req);
      const expressMiddleware = proxyServer._router.handle.bind(
          proxyServer._router
      );
      expressMiddleware(req, res_dummy, (err) => {
        if (err) {
          socket.destroy();
        }
      });
    });

    await new Promise((resolve, reject) => {
      http_server.listen(8080, "localhost", () => {
        console.log("proxy server start success");
        resolve(null);
      });
    });
  });

  afterAll(async () => {
    wss.close();
  });

  test("test web socket", async () => {
    let receiveMessage = "";
    // set up a websocket server
    const wsc = new WebSocket(
      "ws://localhost:8080/ws_path?param_abc=abc",
      ["protocol_test1", "protocol_test2"],
      {
        headers: {
          token: "my_token",
        },
      }
    );
    wsc.on("error", () => {});
    wsc.on("close", () => {});
    wsc.on("message", (data, isBinary) => {
      receiveMessage = data.toString("utf8");
    });
    let valuePromise = checkValueChange(() => {
      return receiveMessage;
    }, welcomeStr);

    await expect(valuePromise).resolves.toBe(welcomeStr);

    // sec protocol change
    valuePromise = checkValueChange(() => {
      return secProtocol;
    }, "protocol_test1,protocol_test2");
    await expect(valuePromise).resolves.toBe("protocol_test1,protocol_test2");

    wsc.send("hello, tom");
    expect(connectPath).toBe("/ws_path?param_abc=abc");
    expect(connectHeaders.token).toBe("my_token");

    valuePromise = checkValueChange(() => {
      return receiveMessage;
    }, "receive :hello, tom");

    await expect(valuePromise).resolves.toBe("receive :hello, tom");

    wsc.close();

    valuePromise = checkValueChange(() => {
      return wss.clients.size;
    }, 0);

    await expect(valuePromise).resolves.toBe(0);
  });

  test("test websocket path prefix remove", async () => {
    const wsc = new WebSocket("ws://localhost:8080/api/websocket_path");
    wsc.on("connection", async () => {
      wsc.send("hello");
      expect(connectPath).toBe("/websocket_path");

      wss.clients.forEach((client) => {
        client.close();
      });

      let valuePromise = checkValueChange(
        () => {
          return wsc.readyState;
        },
        3,
        50,
        4000
      );
      await expect(valuePromise).resolves.toBe(3);
      // reopen the server
      server.listen(8085);
    });
  });
});
