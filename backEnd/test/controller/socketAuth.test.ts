import http from "http";
import { Server } from "socket.io";
import { io as ioClient } from "socket.io-client";
import { createSocketAuthMiddleware } from "../../src/auth/socketAuth";
import { createAccount, createSession } from "../../src/auth/authStore";
import { deleteFolderRecursive } from "../../src/common/utils";

const TEST_DB = "test_db_socket_auth";

describe("socket.io authentication", () => {
  let httpServer: http.Server;
  let io: Server;
  let port: number;
  let token: string;

  beforeAll(async () => {
    deleteFolderRecursive(TEST_DB);
    await createAccount(TEST_DB, "admin", "password123");
    token = (await createSession(TEST_DB, "admin")).token;
    httpServer = http.createServer();
    io = new Server(httpServer, { path: "/api/socket.io" });
    io.use(createSocketAuthMiddleware(TEST_DB));
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    port = (httpServer.address() as any).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => io.close(() => resolve()));
    if (httpServer.listening) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
    deleteFolderRecursive(TEST_DB);
  });

  function connect(cookie?: string): Promise<{ connected: boolean }> {
    return new Promise((resolve) => {
      const options: any = {
        path: "/api/socket.io",
        transports: ["polling"],
        reconnection: false,
      };
      if (cookie) {
        options.extraHeaders = { Cookie: cookie };
      }
      const client = ioClient(`http://127.0.0.1:${port}`, options);
      const timer = setTimeout(() => {
        client.close();
        resolve({ connected: false });
      }, 3000);
      client.on("connect", () => {
        clearTimeout(timer);
        client.close();
        resolve({ connected: true });
      });
      client.on("connect_error", () => {
        clearTimeout(timer);
        client.close();
        resolve({ connected: false });
      });
    });
  }

  test("refuses a handshake without a valid session", async () => {
    expect((await connect()).connected).toBe(false);
    expect((await connect("livemock_session=not-a-token")).connected).toBe(
      false
    );
  });

  test("accepts a handshake with a valid session cookie", async () => {
    expect((await connect(`livemock_session=${token}`)).connected).toBe(true);
  });
});
