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
        expectationId: string;
        modifyValues: Partial<ExpectationM>;
      }>
    ) => {
      const index = state.expectationList.findIndex((item) => item.id === action.payload.expectationId);
      if (index === -1) {
        throw new Error('expectationId not found');
      }
      const item = state.expectationList[index];
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

let { actions, caseReducers, getInitialState, name, reducer } =
  expectationSlice;

let {
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
  updateExpectationMap,
  deleteExpectationMap,
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
  updateExpectationMap,
  deleteExpectationMap,
};
