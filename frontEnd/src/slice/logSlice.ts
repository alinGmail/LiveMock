import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LogM, LogFilterM } from "livemock-core/struct/log";

export interface PresetFilterState {
  expectationId: string | null;
  methods: Array<string>;
  statusCode: Array<string>;
}

export interface LogState {
  logFilter: Array<LogFilterM>;
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
    resetLogFilter(state, action: PayloadAction<Array<LogFilterM>>) {
      state.logFilter = action.payload;
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
  updatePresetFilter,
  setSelectedLogId,
  setSelectedLogItem,
} = actions;

export {
  resetLogFilter,
  updatePresetFilter,
  setSelectedLogId,
  setSelectedLogItem,
  reducer,
};
