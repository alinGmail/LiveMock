import { ExpectationM } from "core/struct/expectation";
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";

export interface ExpectationState {
  expectationList: Array<ExpectationM>;
}

const expectationSlice = createSlice({
  name: "expectation",
  initialState: {
    expectationList: [],
  } as ExpectationState,
  reducers: {
    setExpectationList(state, action: PayloadAction<Array<ExpectationM>>) {
      state.expectationList = action.payload;
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
  },
});

let { actions, caseReducers, getInitialState, name, reducer } =
  expectationSlice;

let { setExpectationList, updateExpectationItem } = actions;

export { setExpectationList, updateExpectationItem, reducer };
