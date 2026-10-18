import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LogM, SimpleFilterM } from "livemock-core/struct/log";

export interface PresetFilterState {
  expectationId: string | null;
  methods: Array<string>;
  statusCode: Array<string>;
}

export interface LogState {
  logFilter: Array<SimpleFilterM>;
  presetFilter: PresetFilterState;
  selectedLogId: number | null;
  selectedLogItem: LogM | null;
}

export const logSlice = createSlice({
  name: "log",
  initialState: {
    logFilter: [],
    presetFilter: {
      expectationId: null,
      methods: [],
      statusCode: [],
    },
    selectedLogId: null,
    selectedLogItem: null,
  } as LogState,
  reducers: {
    resetLogFilter(state, action: PayloadAction<Array<SimpleFilterM>>) {
      state.logFilter = action.payload;
    },
    addLogFilter(state, action: PayloadAction<SimpleFilterM>) {
      state.logFilter.push(action.payload);
    },
    modifyLogFilter(state, action: PayloadAction<SimpleFilterM>) {
      const index = state.logFilter.findIndex(
        (filter) => filter.id === action.payload.id,
      );
      if (index !== -1) {
        state.logFilter[index] = action.payload;
      }
    },
    removeLogFilter(state, action: PayloadAction<string>) {
      state.logFilter = state.logFilter.filter(
        (filter) => filter.id !== action.payload,
      );
    },
    updatePresetFilter(
      state,
      action: PayloadAction<Partial<PresetFilterState>>,
    ) {
      state.presetFilter = {
        ...state.presetFilter,
        ...action.payload,
      };
    },
    setSelectedLogId(state, action: PayloadAction<number | null>) {
      state.selectedLogId = action.payload;
    },
    setSelectedLogItem(state, action: PayloadAction<LogM | null>) {
      state.selectedLogItem = action.payload;
    },
  },
});

const { actions, reducer } = logSlice;
const {
  resetLogFilter,
  addLogFilter,
  modifyLogFilter,
  removeLogFilter,
  updatePresetFilter,
  setSelectedLogId,
  setSelectedLogItem,
} = actions;

export {
  resetLogFilter,
  addLogFilter,
  modifyLogFilter,
  removeLogFilter,
  updatePresetFilter,
  setSelectedLogId,
  setSelectedLogItem,
  reducer,
};
