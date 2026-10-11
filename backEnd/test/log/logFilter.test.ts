import loki from "lokijs";
import {
  FilterType,
  LogFilterCondition,
  PresetFilterM,
  PresetFilterName,
} from "livemock-core/struct/log";
import { changeToLokijsFilter } from "../../src/log/logUtils";

function statusFilter(
  condition: LogFilterCondition,
  value: Array<string>,
): PresetFilterM {
  return {
    type: FilterType.PRESET_FILTER,
    name: PresetFilterName.STATUS_CODE,
    id: "status-filter",
    property: "res.status",
    value,
    condition,
    activate: true,
  };
}

describe("log filter translation (status families)", () => {
  const db = new loki("log-filter-test");
  const collection = db.addCollection("log");
  collection.insert([
    { id: 1, res: { status: 200 } },
    { id: 2, res: { status: 201 } },
    { id: 3, res: { status: 404 } },
    { id: 4, res: { status: 500 } },
    { id: 5, res: { status: null } },
  ]);

  const matchingIds = (condition: LogFilterCondition, value: Array<string>) =>
    collection
      .find(changeToLokijsFilter(statusFilter(condition, value)))
      .map((log: { id: number }) => log.id)
      .sort((a, b) => a - b);

  test("IN matches exact codes only", () => {
    expect(matchingIds(LogFilterCondition.IN, ["404"])).toEqual([3]);
  });

  test("IN does not treat a family token as a range", () => {
    expect(matchingIds(LogFilterCondition.IN, ["2xx"])).toEqual([]);
  });

  test("FAMILY matches a whole range", () => {
    expect(matchingIds(LogFilterCondition.FAMILY, ["2xx"])).toEqual([1, 2]);
  });

  test("FAMILY combines exact values and a family", () => {
    expect(
      matchingIds(LogFilterCondition.FAMILY, ["2xx", "500"]),
    ).toEqual([1, 2, 4]);
  });

  test("FAMILY with no matches returns nothing", () => {
    expect(matchingIds(LogFilterCondition.FAMILY, ["3xx"])).toEqual([]);
  });
});
