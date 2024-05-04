import { ExpectationM } from "core/struct/expectation";
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";
import { matcherReducers } from "./matcherSlice";
import { actionReducers } from "./actionSlice";

export interface ExpectationState {
  expectationList: Array<ExpectationM>;
  expectationMap: {
    [key: string]: ExpectationM;
  };
}

const expectationSlice = createSlice({
  name: "expectation",
  initialState: {
    expectationList: [],
    expectationMap: {},
  } as ExpectationState,
  reducers: {
    setExpectationList(state, action: PayloadAction<Array<ExpectationM>>) {
      state.expectationList = action.payload;
    },
    setExpectationMap(
      state,
      action: PayloadAction<{
        [key: string]: ExpectationM;
      }>
    ) {
      state.expectationMap = action.payload;
    },
    updateExpectationMap(state, action: PayloadAction<ExpectationM>) {
      state.expectationMap[action.payload.id] = action.payload;
    },
    deleteExpectationMap(state, action: PayloadAction<string>) {
      delete state.expectationMap[action.payload];
    },
    updateExpectationItem: (
      state,
      action: PayloadAction<{
        expectationIndex: number;
        modifyValues: Partial<ExpectationM>;
      }>
    ) => {
      const item = state.expectationList[action.payload.expectationIndex];
      Object.assign(item, action.payload.modifyValues);
    },
    deleteExpectation: (state, action: PayloadAction<string>) => {
      state.expectationList = state.expectationList.filter(
        (item) => item.id !== action.payload
      );
    },
    ...matcherReducers,
    ...actionReducers,
  },
});

const { actions, caseReducers, getInitialState, name, reducer } =
  expectationSlice;

const {
  addMatcher,
  modifyMatcher,
  removeMatcher,
  setExpectationList,
  updateExpectationItem,
  addAction,
  removeAction,
  modifyAction,
  deleteExpectation,
  setExpectationMap,
} = actions;
export {
  addMatcher,
  modifyMatcher,
  removeMatcher,
  setExpectationList,
  updateExpectationItem,
  deleteExpectation,
  addAction,
  removeAction,
  modifyAction,
  reducer,
  setExpectationMap,
};
