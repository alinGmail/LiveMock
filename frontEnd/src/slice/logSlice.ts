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

export interface PresetFilterState {
  expectationId: string | null;
  methods: Array<string>;
}

export interface LogState {
  tableColumns: Array<TableColumnItem>;
  currentColumnEditIndex: number;
  columnEditorShow: boolean;
  columnConfigShow: boolean;
  defaultColumnVisible: Array<boolean>;
  logList: Array<LogM>;
  logFilter: Array<LogFilterM>;
  presetFilter: PresetFilterState;
}

export const logSlice = createSlice({
  name: "log",
  initialState: {
    logList: [],
    logFilter: [],
    presetFilter: {
      expectationId: null,
      methods: [],
    },
    tableColumns: [],
    currentColumnEditIndex: -1,
    columnEditorShow: false,
    columnConfigShow: false,
    defaultColumnVisible: [true, true, true, true, true, true],
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
    modifyLogFilter(state, action: PayloadAction<LogFilterM>) {
      const index = state.logFilter.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index === -1) {
        return;
      }
      state.logFilter[index] = action.payload;
    },
    resetLogFilter(state, action: PayloadAction<Array<LogFilterM>>) {
      state.logFilter = action.payload;
    },
    updatePresetFilter(
      state,
      action: PayloadAction<Partial<PresetFilterState>>
    ) {
      state.presetFilter = {
        ...state.presetFilter,
        ...action.payload,
      };
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

      if (index != -1) {
        state.tableColumns[index] = action.payload;
      }
    },
    deleteTableColumn: (state, action: PayloadAction<string>) => {
      state.tableColumns = state.tableColumns.filter((item) => {
        return item.id !== action.payload;
      });
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
    modifyAllTableColumnVisible: (
      state,
      action: PayloadAction<{
        visible: boolean;
      }>
    ) => {
      state.tableColumns.forEach((column) => {
        column.visible = action.payload.visible;
      });
      state.defaultColumnVisible = state.defaultColumnVisible.map((item) => {
        return action.payload.visible;
      });
    },
  },
});

let { actions, caseReducers, getInitialState, name, reducer } = logSlice;

let {
  addLogFilter,
  removeLogFilter,
  resetLogFilter,
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
  modifyLogFilter,
  deleteTableColumn,
  modifyAllTableColumnVisible,
  updatePresetFilter,
} = actions;

export {
  addLogFilter,
  removeLogFilter,
  resetLogFilter,
  setLogList,
  reducer,
  addTableColumn,
  setDefaultColumnVisible,
  setTableColumns,
  modifyTableColumn,
  deleteTableColumn,
  setColumnEdit,
  showColumnConfig,
  hideColumnConfig,
  showColumnEditor,
  hideColumnEditor,
  modifyTableColumnVisible,
  modifyLogFilter,
  modifyAllTableColumnVisible,
  updatePresetFilter,
};
