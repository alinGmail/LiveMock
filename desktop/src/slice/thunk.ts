import {AppDispatch, AppThunk, RootState} from "../store";
import { ExpectationM } from "livemock-core/struct/expectation";
import { setExpectationList } from "./expectationSlice";

export const getExpectationSuccess =
  (projectId: string, expectationList: Array<ExpectationM>):AppThunk =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const curProject = state.project.projectList[state.project.curProjectIndex];
    if (curProject.id === projectId) {
      dispatch(setExpectationList(expectationList));
    }
  };
