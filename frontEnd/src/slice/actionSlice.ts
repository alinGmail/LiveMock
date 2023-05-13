import { Draft, PayloadAction } from "@reduxjs/toolkit";
import { ActionM } from "core/struct/action";
import { ExpectationState } from "./expectationSlice";

export const actionReducers = {
  modifyAction: (state:Draft<ExpectationState>,action:PayloadAction<{
      expectationIndex:number;
      actionUpdate:ActionM;
  }>) => {
      let {actionUpdate: newAction, expectationIndex} = action.payload;
      const actions = state.expectationList[expectationIndex].actions;
      const index = actions.findIndex(item => item.id === newAction.id);
      actions[index] = {...newAction};
  },
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
