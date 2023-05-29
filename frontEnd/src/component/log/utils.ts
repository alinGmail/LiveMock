import { LogFilterCondition } from "core/struct/log";
import {ColumnDisplayType} from "../../slice/logSlice";

export function getStringConditionWord(condition: LogFilterCondition) {
    return condition;
}


export function getDefaultColumnTitles() {
    return [
        {
            title: "method",
            displayType: ColumnDisplayType.TEXT,
        },
        {
            title: "path",
            displayType: ColumnDisplayType.TEXT,
        },
        {
            title: "body",
            displayType: ColumnDisplayType.JSON,
        },
        {
            title: "json",
            displayType: ColumnDisplayType.JSON,
        },
    ];
}