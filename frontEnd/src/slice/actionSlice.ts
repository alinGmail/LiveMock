import { Draft, PayloadAction } from "@reduxjs/toolkit";
import { ActionM } from "core/struct/action";
import { ExpectationState } from "./expectationSlice";

export const actionReducers = {
  modifyAction: () => {},
  addAction: (
    state: Draft<ExpectationState>,
    action: PayloadAction<{
      expectationIndex: number;
      action: ActionM;
    }>
  ) => {
    let { action: actionM, expectationIndex } = action.payload;
    state.expectationList[expectationIndex].actions.push(actionM);
  },
  removeAction: (
    state: Draft<ExpectationState>,
    action: PayloadAction<{
      expectationIndex: number;
      actionId: string;
    }>
  ) => {
    let { actionId, expectationIndex } = action.payload;
    const expectation = state.expectationList[expectationIndex];
    expectation.actions = expectation.actions.filter(
      (item) => item.id !== actionId
    );
  },
};
