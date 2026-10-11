import loki from "lokijs";
import {
  FilterType,
  LogFilterCondition,
  PresetFilterM,
  PresetFilterName,
} from "livemock-core/struct/log";
import { changeToLokijsFilter } from "../../src/log/logUtils";

function statusFilter(value: Array<string>): PresetFilterM {
  return {
    type: FilterType.PRESET_FILTER,
    name: PresetFilterName.STATUS_CODE,
    id: "status-filter",
    property: "res.status",
    value,
    condition: LogFilterCondition.IN,
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

  const matchingIds = (value: Array<string>) =>
    collection
      .find(changeToLokijsFilter(statusFilter(value)))
      .map((log: { id: number }) => log.id)
      .sort((a, b) => a - b);

  test("exact codes keep working", () => {
    expect(matchingIds(["404"])).toEqual([3]);
  });

  test("a family matches its whole range", () => {
    expect(matchingIds(["2xx"])).toEqual([1, 2]);
  });

  test("exact values and a family combine", () => {
    expect(matchingIds(["2xx", "500"])).toEqual([1, 2, 4]);
  });

  test("a family with no matches returns nothing", () => {
    expect(matchingIds(["3xx"])).toEqual([]);
  });
});
