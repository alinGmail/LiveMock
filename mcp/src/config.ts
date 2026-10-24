export interface LiveMockMcpConfig {
  /** Origin of the LiveMock web server, without a trailing slash or `/api`. */
  baseUrl: string;
  /** Bearer token; null when the user has not configured one yet. */
  token: string | null;
  /** Client-side only: hide write tools from tools/list. */
  readOnly: boolean;
}

export const DEFAULT_BASE_URL = "http://localhost:9002";

function normalizeBaseUrl(raw: string): string {
  let value = raw.trim();
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }
  const url = new URL(value);
  let pathname = url.pathname.replace(/\/+$/, "");
  if (pathname.toLowerCase().endsWith("/api")) {
    pathname = pathname.slice(0, -4);
  }
  url.pathname = pathname || "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function parseBoolean(raw: string | undefined): boolean {
  if (!raw) {
    return false;
  }
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): LiveMockMcpConfig {
  const rawUrl = env.LIVEMOCK_URL?.trim();
  const rawToken = env.LIVEMOCK_API_TOKEN?.trim();
  return {
    baseUrl: rawUrl ? normalizeBaseUrl(rawUrl) : DEFAULT_BASE_URL,
    token: rawToken ? rawToken : null,
    readOnly: parseBoolean(env.LIVEMOCK_MCP_READ_ONLY),
  };
}
