import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LogM, LogFilterM } from "core/struct/log";
import _ from "lodash";

export enum ColumnDisplayType {
  TEXT = "TEXT",
  JSON = "JSON",
}

export interface TableColumnItem {
  id: string;
  name: string;
  label: string;
  path: string;
  displayType: ColumnDisplayType;
  visible: boolean;
}

export interface LogState {
  tableColumns: Array<TableColumnItem>;
  currentColumnEditIndex: number;
  columnEditorShow: boolean;
  columnConfigShow: boolean;
  defaultColumnVisible: Array<boolean>;
  logList: Array<LogM>;
  logFilter: Array<LogFilterM>;
}

export const logSlice = createSlice({
  name: "log",
  initialState: {
    logList: [],
    logFilter: [],
    tableColumns: [],
    currentColumnEditIndex: -1,
    columnEditorShow: false,
    columnConfigShow: false,
    defaultColumnVisible: [true, true, true, true],
  } as LogState,
  reducers: {
    setLogList(state, action: PayloadAction<Array<LogM>>) {
      state.logList = action.payload;
    },
    addLogFilter(state, action: PayloadAction<LogFilterM>) {
      state.logFilter.push(action.payload);
    },
    removeLogFilter(state, action: PayloadAction<string>) {
      state.logFilter = state.logFilter.filter(
        (item) => item.id !== action.payload
      );
    },
    setTableColumns: (state, action: PayloadAction<Array<TableColumnItem>>) => {
      state.tableColumns = action.payload;
    },
    addTableColumn: (state, action: PayloadAction<TableColumnItem>) => {
      state.currentColumnEditIndex = state.tableColumns.length;
      state.tableColumns.push(action.payload);
    },
    modifyTableColumn: (state, action: PayloadAction<TableColumnItem>) => {
      const index = _.findIndex(
        state.tableColumns,
        (item) => item.id == action.payload.id
      );
      console.log(action.payload.id);
      console.log(index);
      if (index != -1) {
        state.tableColumns[index] = action.payload;
      }
    },
    modifyTableColumnVisible: (
      state,
      action: PayloadAction<{
        index: number;
        visible: boolean;
      }>
    ) => {
      let { index, visible } = action.payload;
      if (index != -1) {
        state.tableColumns[index].visible = visible;
      }
    },
    showColumnEditor: (state, action: PayloadAction<void>) => {
      console.log("show column editor");
      state.columnEditorShow = true;
    },
    hideColumnEditor: (state, action: PayloadAction<void>) => {
      state.columnEditorShow = false;
    },
    setColumnEdit: (state, action: PayloadAction<TableColumnItem>) => {
      state.currentColumnEditIndex = _.findIndex(
        state.tableColumns,
        (item) => item.id == action.payload.id
      );
    },
    showColumnConfig: (state, action: PayloadAction<void>) => {
      state.columnConfigShow = true;
    },
    hideColumnConfig: (state, action: PayloadAction<void>) => {
      state.columnConfigShow = false;
    },
    setDefaultColumnVisible: (
      state,
      action: PayloadAction<{
        index: number;
        visible: boolean;
      }>
    ) => {
      let { visible, index } = action.payload;
      state.defaultColumnVisible[index] = visible;
    },
  },
});

let { actions, caseReducers, getInitialState, name, reducer } = logSlice;

let {
  addLogFilter,
  removeLogFilter,
  setLogList,
  addTableColumn,
  setColumnEdit,
  setTableColumns,
  setDefaultColumnVisible,
  showColumnConfig,
  hideColumnConfig,
  modifyTableColumnVisible,
  modifyTableColumn,
  showColumnEditor,
  hideColumnEditor,
} = actions;

export {
  addLogFilter,
  removeLogFilter,
  setLogList,
  reducer,
  addTableColumn,
  setDefaultColumnVisible,
  setTableColumns,
  modifyTableColumn,
  setColumnEdit,
  showColumnConfig,
  hideColumnConfig,
  showColumnEditor,
  hideColumnEditor,
  modifyTableColumnVisible,
};
