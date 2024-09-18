import { LogFilterCondition } from "core/struct/log";
import { ColumnDisplayType } from "../../slice/logSlice";

export function getStringConditionWord(condition: LogFilterCondition) {
  switch (condition) {
    case LogFilterCondition.NOT_EQUAL:
      return "not equal";
    case LogFilterCondition.EQUAL:
    case LogFilterCondition.CONTAINS:
    case LogFilterCondition.GREATER:
    case LogFilterCondition.LESS:
    case LogFilterCondition.IN:
      return condition.toLowerCase();
  }
}

export function getDefaultColumnTitles() {
  return [
    {
      title: "method",
      displayType: ColumnDisplayType.TEXT,
    },
    {
      title: "status code",
      displayType: ColumnDisplayType.TEXT,
    },
    {
      title: "path",
      displayType: ColumnDisplayType.TEXT,
    },
    {
      title: "expectation",
      displayType: ColumnDisplayType.TEXT,
    },
    {
      title: "body",
      displayType: ColumnDisplayType.JSON,
    },
    {
      title: "root",
      displayType: ColumnDisplayType.JSON,
    },
  ];
}
