import { getConfig } from "../config/config";
import {
  getExpectationDb,
  getGroupDb,
  getProjectCollection,
  saveAndCloseProjectDb,
} from "../db/dbManager";
import { createExpectation, ExpectationM } from "livemock-core/struct/expectation";
import {
  createExpectationGroup,
  ExpectationGroupM,
} from "livemock-core/struct/expectationGroup";
import {
  createHeaderMatcher,
  createMethodMatcher,
  createParamMatcher,
  createPathMatcher,
  createQueryMatcher,
  MatcherCondition,
  RequestMatcherM,
} from "livemock-core/struct/matcher";
import {
  ActionM,
  ContentHandler,
  createCustomResponseAction,
  createProxyAction,
  createStaticDirectoryAction,
  ProxyProtocol,
  ResponseType,
} from "livemock-core/struct/action";

/**
 * Seed a project with demo groups and expectations, for exercising the
 * Expectation page in development. The backend must be stopped first: LokiJS
 * is memory-backed with periodic autosave, so a running process would overwrite
 * the change. Mirrors the reset-admin CLI pattern.
 */

interface GroupDef {
  name: string;
  priority: number;
  activate: boolean;
}

type MatcherSpec =
  | { type: "method"; value: string; condition?: MatcherCondition }
  | { type: "path"; value: string; condition?: MatcherCondition }
  | { type: "header"; name: string; value: string; condition?: MatcherCondition }
  | { type: "query"; name: string; value?: string; condition?: MatcherCondition }
  | { type: "param"; name: string; value: string; condition?: MatcherCondition };

type ActionSpec =
  | {
      type: "custom";
      status: number;
      responseType?: "JSON" | "TEXT";
      value?: string;
    }
  | { type: "proxy"; host: string; prefixRemove?: string }
  | { type: "static"; urlPrefix: string; folderPath: string };

interface ExpectationSpec {
  name: string;
  description?: string;
  group?: string | null;
  priority?: number;
  activate?: boolean;
  delay?: number;
  matchers?: Array<MatcherSpec>;
  actions?: Array<ActionSpec>;
}

const GROUP_DEFS: Array<GroupDef> = [
  { name: "auth flows", priority: 300, activate: true },
  { name: "checkout errors", priority: 200, activate: false },
  { name: "legacy", priority: 50, activate: true },
  { name: "experiments", priority: 10, activate: true },
];

const EXPECTATION_SPECS: Array<ExpectationSpec> = [
  {
    name: "login success",
    description:
      "Successful login returns a signed JWT with a one hour expiry.",
    group: "auth flows",
    priority: 30,
    matchers: [
      { type: "method", value: "POST" },
      { type: "path", value: "/api/login", condition: MatcherCondition.START_WITH },
    ],
    actions: [
      {
        type: "custom",
        status: 200,
        value: '{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6…",\n  "expiresIn": 3600\n}',
      },
    ],
  },
  {
    name: "invalid credentials",
    description: "Rejects a wrong password with 401 and an error code.",
    group: "auth flows",
    priority: 20,
    matchers: [
      { type: "method", value: "POST" },
      { type: "path", value: "/api/login" },
      { type: "param", name: "password", value: "wrong" },
    ],
    actions: [
      {
        type: "custom",
        status: 401,
        value: '{\n  "error": "invalid_credentials"\n}',
      },
    ],
  },
  {
    name: "token refresh",
    description: "Rotates the access token using a Bearer refresh token.",
    group: "auth flows",
    priority: 10,
    matchers: [
      { type: "method", value: "POST" },
      { type: "path", value: "/api/refresh", condition: MatcherCondition.START_WITH },
      {
        type: "header",
        name: "Authorization",
        value: "Bearer",
        condition: MatcherCondition.CONTAINS,
      },
    ],
    actions: [
      {
        type: "custom",
        status: 200,
        value: '{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6…"\n}',
      },
    ],
  },
  {
    name: "card declined",
    description: "Declines a Stripe test card with a card_declined code.",
    group: "checkout errors",
    priority: 40,
    matchers: [
      { type: "path", value: "/api/checkout", condition: MatcherCondition.START_WITH },
      { type: "param", name: "card", value: "4000000000000002" },
    ],
    actions: [
      {
        type: "custom",
        status: 402,
        value: '{\n  "decline_code": "card_declined"\n}',
      },
    ],
  },
  {
    name: "checkout timeout",
    description: "Proxies to Stripe and simulates a five second timeout.",
    group: "checkout errors",
    priority: 10,
    delay: 5000,
    matchers: [
      { type: "path", value: "/api/checkout", condition: MatcherCondition.START_WITH },
      { type: "query", name: "simulate", value: "timeout" },
    ],
    actions: [
      { type: "proxy", host: "https://api.stripe.com", prefixRemove: "/api" },
    ],
  },
  {
    name: "legacy ping",
    description: "Legacy health check, kept for backwards compatibility.",
    group: "legacy",
    priority: 0,
    activate: false,
    matchers: [{ type: "path", value: "/ping" }],
    actions: [
      { type: "custom", status: 200, responseType: "TEXT", value: "pong" },
    ],
  },
  {
    name: "404 example",
    description: "Catch-all fallback for any unmatched path.",
    group: null,
    priority: 0,
    matchers: [{ type: "path", value: "/", condition: MatcherCondition.START_WITH }],
    actions: [
      {
        type: "custom",
        status: 404,
        value: '{\n  "message": "not found"\n}',
      },
    ],
  },
  {
    name: "static assets",
    description: "Serves files from ./public under the /static prefix.",
    group: null,
    priority: 0,
    matchers: [
      { type: "path", value: "/static", condition: MatcherCondition.START_WITH },
    ],
    actions: [
      { type: "static", urlPrefix: "/static", folderPath: "./public" },
    ],
  },
  {
    name: "empty payload",
    description: "",
    group: null,
    priority: 0,
    matchers: [
      { type: "query", name: "page", condition: MatcherCondition.SHOWED },
    ],
    actions: [],
  },
  {
    name: "fallback response",
    description: "Matches anything when nothing more specific applies.",
    group: null,
    priority: 0,
    matchers: [],
    actions: [
      {
        type: "custom",
        status: 200,
        value: '{\n  "ok": true\n}',
      },
    ],
  },
];

function buildMatcher(spec: MatcherSpec): RequestMatcherM {
  let matcher: RequestMatcherM;
  switch (spec.type) {
    case "method": {
      const created = createMethodMatcher();
      created.value = spec.value;
      matcher = created;
      break;
    }
    case "path": {
      const created = createPathMatcher();
      created.value = spec.value;
      matcher = created;
      break;
    }
    case "header": {
      const created = createHeaderMatcher();
      created.name = spec.name;
      created.value = spec.value;
      matcher = created;
      break;
    }
    case "query": {
      const created = createQueryMatcher();
      created.name = spec.name;
      created.value = spec.value ?? "";
      matcher = created;
      break;
    }
    case "param": {
      const created = createParamMatcher();
      created.name = spec.name;
      created.value = spec.value;
      matcher = created;
      break;
    }
  }
  matcher.conditions = spec.condition ?? MatcherCondition.IS;
  return matcher;
}

function buildAction(spec: ActionSpec): ActionM {
  if (spec.type === "custom") {
    const action = createCustomResponseAction();
    action.status = spec.status;
    action.responseContent.type =
      spec.responseType === "TEXT" ? ResponseType.TEXT : ResponseType.JSON;
    action.responseContent.value = spec.value ?? "";
    action.responseContent.contentHandler = ContentHandler.NONE;
    return action;
  }
  if (spec.type === "proxy") {
    const action = createProxyAction();
    action.host = spec.host;
    action.protocol = spec.host.startsWith("https")
      ? ProxyProtocol.HTTPS
      : ProxyProtocol.HTTP;
    action.prefixRemove = spec.prefixRemove ?? null;
    return action;
  }
  const action = createStaticDirectoryAction();
  action.urlPrefix = spec.urlPrefix;
  action.folderPath = spec.folderPath;
  return action;
}

function buildExpectation(spec: ExpectationSpec, createTime: Date): ExpectationM {
  const expectation = createExpectation();
  expectation.name = spec.name;
  expectation.description = spec.description ?? "";
  expectation.priority = spec.priority ?? 0;
  expectation.activate = spec.activate ?? true;
  expectation.delay = spec.delay ?? 0;
  expectation.createTime = createTime;
  expectation.matchers = (spec.matchers ?? []).map(buildMatcher);
  expectation.actions = (spec.actions ?? []).map(buildAction);
  return expectation;
}

function saveAndClose(db: Loki): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    db.saveDatabase((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  }).then(() => {
    db.close();
  });
}

export interface SeedResult {
  projectId: string;
  groups: number;
  expectations: number;
}

export async function seedDemo(
  dbPath: string,
  projectNameOrId: string,
  reset = true,
): Promise<SeedResult> {
  const projectCollection = await getProjectCollection(dbPath);
  const project =
    projectCollection.findOne({ name: projectNameOrId }) ??
    projectCollection.findOne({ id: projectNameOrId });
  if (!project) {
    const names = projectCollection
      .find({})
      .map((item) => `${item.name} (${item.id})`)
      .join(", ");
    throw new Error(
      `project "${projectNameOrId}" not found. existing projects: ${names || "none"}`,
    );
  }
  const projectId = project.id;

  const groupDb = await getGroupDb(projectId, dbPath);
  const groupCollection =
    groupDb.getCollection<ExpectationGroupM>("group") ??
    groupDb.addCollection<ExpectationGroupM>("group");
  const expectationDb = await getExpectationDb(projectId, dbPath);
  const expectationCollection =
    expectationDb.getCollection<ExpectationM>("expectation") ??
    expectationDb.addCollection<ExpectationM>("expectation");

  if (reset) {
    groupCollection.clear();
    expectationCollection.clear();
  }

  const now = Date.now();
  const groups = GROUP_DEFS.map((def, index) => {
    const group = createExpectationGroup(def.name);
    group.priority = def.priority;
    group.activate = def.activate;
    group.createTime = new Date(now - index * 1000);
    groupCollection.insert(group);
    return group;
  });
  const groupByName = new Map(groups.map((group) => [group.name, group]));

  const expectations = EXPECTATION_SPECS.map((spec, index) => {
    const expectation = buildExpectation(spec, new Date(now - index * 1000));
    const group = spec.group ? groupByName.get(spec.group) : null;
    expectation.groupId = group ? group.id : null;
    expectationCollection.insert(expectation);
    return expectation;
  });

  await saveAndClose(groupDb);
  await saveAndClose(expectationDb);
  await saveAndCloseProjectDb(dbPath);

  return {
    projectId,
    groups: groups.length,
    expectations: expectations.length,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const projectNameOrId = args.find((arg) => !arg.startsWith("--"));
  if (!projectNameOrId) {
    console.error(
      "usage: yarn workspace livemock seed-demo <project-name-or-id> [--no-reset]",
    );
    process.exit(1);
  }
  const reset = !args.includes("--no-reset");
  const config = getConfig();
  const result = await seedDemo(config.database.path, projectNameOrId, reset);
  process.stdout.write(
    `seeded ${result.groups} groups and ${result.expectations} expectations into project ${result.projectId}\n` +
      "start the backend again to see them\n",
    () => process.exit(0),
  );
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`, () => process.exit(1));
  });
}
