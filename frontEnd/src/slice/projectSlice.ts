import { ProjectM } from "livemock-core/struct/project";
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";

interface ProjectState {
  projectList: Array<ProjectM>;
  curProjectIndex: number;
}
const initialState: ProjectState = {
  projectList: [],
  curProjectIndex: 0,
}

const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    setProjectList: (state, action: PayloadAction<Array<ProjectM>>) => {
      state.projectList = action.payload;
    },
    setCurProjectIndex: (state, action: PayloadAction<number>) => {
      state.curProjectIndex = action.payload;
    },
  },
});

let { actions, caseReducers, getInitialState, name, reducer } = projectSlice;
let { setCurProjectIndex, setProjectList } = actions;

export { reducer, setCurProjectIndex, setProjectList };
