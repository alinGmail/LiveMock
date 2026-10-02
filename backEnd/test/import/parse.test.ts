import fs from "fs";
import path from "path";
import { parseImportContent } from "livemock-core/import/index";
import { ImportFormat } from "livemock-core/import/types";
import { ExpectationM } from "livemock-core/struct/expectation";
import {
  MatcherCondition,
  RequestMatcherM,
  RequestMatcherType,
} from "livemock-core/struct/matcher";
import {
  ActionType,
  CustomResponseActionM,
} from "livemock-core/struct/action";

interface ImportedExpectation {
  source: string;
  expectation: ExpectationM;
}

function readFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

function findExpectation(
  expectations: Array<ImportedExpectation>,
  source: string
): ExpectationM {
  const item = expectations.find((entry) => entry.source === source);
  if (!item) {
    throw new Error(`expectation not found: ${source}`);
  }
  return item.expectation;
}

function methodValue(expectation: ExpectationM): string {
  const matcher = expectation.matchers.find(
    (item) => item.type === RequestMatcherType.METHOD
  );
  return matcher ? matcher.value : "";
}

function getPathMatcher(expectation: ExpectationM): RequestMatcherM {
  const matcher = expectation.matchers.find(
    (item) => item.type === RequestMatcherType.PATH
  );
  if (!matcher) {
    throw new Error("path matcher not found");
  }
  return matcher;
}

function getResponse(expectation: ExpectationM): CustomResponseActionM {
  const action = expectation.actions[0];
  expect(action.type).toBe(ActionType.CUSTOM_RESPONSE);
  return action as CustomResponseActionM;
}

describe("parse openapi 3", () => {
  test("maps operations to expectations", async () => {
    const result = await parseImportContent(readFixture("petstore-oas3.json"));
    expect(result.format).toBe(ImportFormat.OPENAPI3);
    expect(result.failures).toHaveLength(0);
    expect(result.expectations).toHaveLength(3);

    const getPet = findExpectation(result.expectations, "GET /pet/{petId}");
    expect(getPet.name).toBe("Find pet by ID");
    expect(getPet.matchers).toHaveLength(2);
    expect(methodValue(getPet)).toBe("GET");
    const getPetPath = getPathMatcher(getPet);
    expect(getPetPath.value).toBe("/pet/*");
    expect(getPetPath.conditions).toBe(MatcherCondition.MATCH_GLOB);
    const getPetResponse = getResponse(getPet);
    expect(getPetResponse.status).toBe(200);
    expect(JSON.parse(getPetResponse.responseContent.value)).toEqual({
      id: 1,
      name: "doggie",
      status: "available",
      tags: [{ id: 0, name: "string" }],
    });

    const addPet = findExpectation(result.expectations, "POST /pet");
    const addPetResponse = getResponse(addPet);
    expect(addPetResponse.status).toBe(200);
    expect(JSON.parse(addPetResponse.responseContent.value)).toEqual({
      id: 1,
      name: "doggie",
      status: "available",
    });

    const inventory = findExpectation(
      result.expectations,
      "GET /store/inventory"
    );
    expect(inventory.name).toBe("getInventory");
    expect(getResponse(inventory).responseContent.value).toBe("{}");
  });

  test("keeps servers base path when requested", async () => {
    const result = await parseImportContent(readFixture("petstore-oas3.json"), {
      preserveServerPrefix: true,
    });
    const getPet = findExpectation(result.expectations, "GET /pet/{petId}");
    expect(getPathMatcher(getPet).value).toBe("/v3/pet/*");
  });
});

describe("parse swagger 2.0", () => {
  test("normalizes to openapi and maps operations", async () => {
    const result = await parseImportContent(readFixture("petstore-oas2.json"));
    expect(result.format).toBe(ImportFormat.SWAGGER2);
    expect(result.failures).toHaveLength(0);
    expect(result.expectations).toHaveLength(2);

    const getPet = findExpectation(result.expectations, "GET /pet/{petId}");
    expect(getPet.name).toBe("Find pet by ID");
    const getPetPath = getPathMatcher(getPet);
    expect(getPetPath.value).toBe("/pet/*");
    expect(getPetPath.conditions).toBe(MatcherCondition.MATCH_GLOB);
    expect(JSON.parse(getResponse(getPet).responseContent.value)).toEqual({
      id: 0,
      name: "doggie",
    });

    const addPet = findExpectation(result.expectations, "POST /pet");
    const addPetResponse = getResponse(addPet);
    expect(addPetResponse.status).toBe(201);
    expect(JSON.parse(addPetResponse.responseContent.value)).toEqual({
      id: 0,
      name: "string",
    });
  });
});

describe("parse postman collection", () => {
  test("flattens folders, resolves variables and saved examples", async () => {
    const result = await parseImportContent(
      readFixture("postman-collection.json")
    );
    expect(result.format).toBe(ImportFormat.POSTMAN);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].source).toBe("Unresolved");
    expect(result.failures[0].reason).toContain("未解析的变量");
    expect(result.expectations).toHaveLength(3);

    const getUser = findExpectation(result.expectations, "Get user");
    expect(methodValue(getUser)).toBe("GET");
    const getUserPath = getPathMatcher(getUser);
    expect(getUserPath.value).toBe("/users/*");
    expect(getUserPath.conditions).toBe(MatcherCondition.MATCH_GLOB);
    const getUserResponse = getResponse(getUser);
    expect(getUserResponse.status).toBe(200);
    expect(JSON.parse(getUserResponse.responseContent.value)).toEqual({
      id: 1,
      name: "alin",
    });

    const createUser = findExpectation(result.expectations, "Create user");
    expect(getPathMatcher(createUser).value).toBe("/users");
    const createUserResponse = getResponse(createUser);
    expect(createUserResponse.status).toBe(200);
    expect(createUserResponse.responseContent.value).toBe("{}");

    const health = findExpectation(result.expectations, "Health");
    const healthResponse = getResponse(health);
    expect(healthResponse.responseContent.value).toBe("OK");
  });
});
