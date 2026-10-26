import { LiveMockError } from "./errors.js";
import {
  ExpectationGroupM,
  ExpectationM,
  LogM,
  LogViewM,
  PresetFilterInput,
  ProjectM,
  QueryLogsByFiltersParams,
  SimpleFilterInput,
} from "./types.js";

const REQUEST_TIMEOUT_MS = 30_000;

interface RequestOptions {
  method?: string;
  query?: Record<
    string,
    string | number | boolean | undefined | null | Array<string | number>
  >;
  body?: unknown;
}

export interface QueryLogsParams {
  maxLogId?: number;
  limit?: number;
  method?: string | Array<string>;
  path?: string | Array<string>;
  pathContains?: string | Array<string>;
  status?: string | number | Array<string | number>;
  expectationId?: string | Array<string>;
  since?: string | number;
  until?: string | number;
  includeBody?: boolean;
}

export interface QueryLogsResult {
  logs: Array<LogM>;
  hasMore: boolean;
}

interface ImportResult {
  format: string;
  created: number;
  overwritten: number;
  skipped: number;
  failures: Array<unknown>;
}

export class LiveMockClient {
  private readonly baseUrl: string;
  private readonly token: string | null;

  constructor(baseUrl: string, token: string | null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    if (!this.token) {
      throw new LiveMockError(
        null,
        "LIVEMOCK_API_TOKEN is not set. Create a token on the LiveMock Settings page and add it to the MCP client configuration."
      );
    }

    const url = new URL(`${this.baseUrl}/api${path}`);
    Object.entries(options.query ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }
      const values = Array.isArray(value) ? value : [value];
      values.forEach((item) => {
        if (item !== "") {
          url.searchParams.append(key, String(item));
        }
      });
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.token}`,
          ...(options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error: any) {
      if (error?.name === "AbortError") {
        throw new LiveMockError(
          null,
          `LiveMock did not respond within ${REQUEST_TIMEOUT_MS / 1000}s at ${this.baseUrl}.`
        );
      }
      throw new LiveMockError(
        null,
        `Could not reach LiveMock at ${this.baseUrl}: ${error?.message ?? error}`
      );
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const serverMessage =
        typeof data?.error?.message === "string"
          ? data.error.message
          : typeof data === "string" && data
            ? data
            : response.statusText;
      if (response.status === 401) {
        throw new LiveMockError(
          401,
          "LiveMock rejected the API token (401). Create a new token on the Settings page and update LIVEMOCK_API_TOKEN."
        );
      }
      if (response.status === 403) {
        throw new LiveMockError(
          403,
          `LiveMock refused the request (403): ${serverMessage}`
        );
      }
      throw new LiveMockError(
        response.status,
        `LiveMock returned ${response.status}: ${serverMessage}`
      );
    }

    return data as T;
  }

  listProjects(): Promise<ProjectM[]> {
    return this.request<ProjectM[]>("/project/");
  }

  createProject(project: ProjectM): Promise<ProjectM> {
    return this.request<ProjectM>("/project/", {
      method: "POST",
      body: { project },
    });
  }

  updateProject(
    projectId: string,
    projectUpdate: Partial<ProjectM>
  ): Promise<ProjectM> {
    return this.request<ProjectM>(`/project/${projectId}`, {
      method: "PUT",
      body: { projectUpdate },
    });
  }

  deleteProject(projectId: string): Promise<unknown> {
    return this.request(`/project/${projectId}`, { method: "DELETE" });
  }

  startProject(projectId: string): Promise<unknown> {
    return this.request(`/project/start/${projectId}`, { method: "POST" });
  }

  stopProject(projectId: string): Promise<unknown> {
    return this.request(`/project/stop/${projectId}`, { method: "POST" });
  }

  listExpectations(projectId: string): Promise<ExpectationM[]> {
    return this.request<ExpectationM[]>("/expectation/", {
      query: { projectId },
    });
  }

  getExpectation(
    projectId: string,
    expectationId: string
  ): Promise<ExpectationM> {
    return this.request<ExpectationM>(
      `/expectation/${expectationId}`,
      { query: { projectId } }
    );
  }

  createExpectation(
    projectId: string,
    expectation: ExpectationM
  ): Promise<ExpectationM> {
    return this.request<ExpectationM>("/expectation/", {
      method: "POST",
      body: { projectId, expectation },
    });
  }

  updateExpectation(
    projectId: string,
    expectationId: string,
    expectationUpdate: Partial<ExpectationM>
  ): Promise<ExpectationM> {
    return this.request<ExpectationM>(
      `/expectation/${expectationId}`,
      {
        method: "PUT",
        body: { projectId, expectationUpdate },
      }
    );
  }

  deleteExpectation(
    projectId: string,
    expectationId: string
  ): Promise<unknown> {
    return this.request(`/expectation/${expectationId}`, {
      method: "DELETE",
      query: { projectId },
    });
  }

  listLogViews(projectId: string): Promise<Array<LogViewM>> {
    return this.request<Array<LogViewM>>("/log/logView", {
      query: { projectId },
    });
  }

  addLogFilter(
    projectId: string,
    logViewId: string,
    filter: SimpleFilterInput
  ): Promise<unknown> {
    return this.request("/logFilter/", {
      method: "POST",
      body: { projectId, logViewId, filter },
    });
  }

  updateLogFilter(
    projectId: string,
    logViewId: string,
    filterId: string,
    filter: SimpleFilterInput
  ): Promise<unknown> {
    return this.request(`/logFilter/${filterId}`, {
      method: "POST",
      body: { projectId, logViewId, filter },
    });
  }

  deleteLogFilter(
    projectId: string,
    logViewId: string,
    filterId: string
  ): Promise<unknown> {
    return this.request(`/logFilter/${filterId}`, {
      method: "DELETE",
      query: { projectId, logViewId },
    });
  }

  updatePresetLogFilter(
    projectId: string,
    logViewId: string,
    filter: PresetFilterInput
  ): Promise<unknown> {
    return this.request("/logFilter/updatePresetLogFilter", {
      method: "POST",
      body: { projectId, logViewId, filter },
    });
  }

  listGroups(projectId: string): Promise<ExpectationGroupM[]> {
    return this.request<ExpectationGroupM[]>("/group/", {
      query: { projectId },
    });
  }

  createGroup(
    projectId: string,
    group: ExpectationGroupM
  ): Promise<ExpectationGroupM> {
    return this.request<ExpectationGroupM>("/group/", {
      method: "POST",
      body: { projectId, group },
    });
  }

  updateGroup(
    projectId: string,
    groupId: string,
    groupUpdate: Partial<ExpectationGroupM>
  ): Promise<ExpectationGroupM> {
    return this.request<ExpectationGroupM>(`/group/${groupId}`, {
      method: "PUT",
      body: { projectId, groupUpdate },
    });
  }

  deleteGroup(projectId: string, groupId: string): Promise<unknown> {
    return this.request(`/group/${groupId}`, {
      method: "DELETE",
      query: { projectId },
    });
  }

  queryLogs(
    projectId: string,
    params: QueryLogsParams = {}
  ): Promise<QueryLogsResult> {
    return this.request<QueryLogsResult>("/log/query", {
      query: {
        projectId,
        maxLogId: params.maxLogId,
        limit: params.limit,
        method: params.method,
        path: params.path,
        pathContains: params.pathContains,
        status: params.status,
        expectationId: params.expectationId,
        since: params.since,
        until: params.until,
        includeBody: params.includeBody,
      },
    });
  }

  queryLogsByFilters(
    projectId: string,
    params: QueryLogsByFiltersParams
  ): Promise<QueryLogsResult> {
    return this.request<QueryLogsResult>("/log/queryByFilters", {
      method: "POST",
      body: {
        projectId,
        filters: params.filters,
        maxLogId: params.maxLogId,
        limit: params.limit,
        includeBody: params.includeBody,
      },
    });
  }

  getLog(projectId: string, logId: number): Promise<{ logItem: LogM }> {
    return this.request<{ logItem: LogM }>(`/log/detail/${logId}`, {
      query: { projectId },
    });
  }

  importApiSpec(
    projectId: string,
    content: string,
    overwrite: boolean
  ): Promise<ImportResult> {
    return this.request<ImportResult>("/expectation/batchImport", {
      method: "POST",
      body: { projectId, content, options: { overwrite } },
    });
  }
}
