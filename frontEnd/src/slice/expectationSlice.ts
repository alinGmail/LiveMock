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
    updateExpectationState: (
      state,
      action: PayloadAction<{
        updateFn: (expectation: Draft<ExpectationState>) => void;
      }>
    ) => {
      action.payload.updateFn(state);
    },
  },
});

let {actions, caseReducers, getInitialState, name, reducer} = expectationSlice;

let {setExpectationList, updateExpectationState} = actions;

export {setExpectationList,updateExpectationState,reducer}