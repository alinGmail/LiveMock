import { ProjectM } from "core/struct/project";
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";

interface ProjectState {
  projectList: Array<ProjectM>;
  curProjectIndex: number;
}

const projectSlice = createSlice<
  ProjectState,
  {
    setProjectList: (
      state: Draft<ProjectState>,
      action: PayloadAction<Array<ProjectM>>
    ) => void;
    setCurProjectIndex: (
      state: Draft<ProjectState>,
      action: PayloadAction<number>
    ) => void;
  },
  "project"
>({
  name: "project",
  initialState: {
    projectList: [],
    curProjectIndex: 0,
  },
  reducers: {
    setProjectList: (state, action) => {
      state.projectList = action.payload;
    },
    setCurProjectIndex: (state, action) => {
      state.curProjectIndex = action.payload;
    },
  },
});

let { actions, caseReducers, getInitialState, name, reducer } = projectSlice;
let { setCurProjectIndex, setProjectList } = actions;

export { reducer, setCurProjectIndex, setProjectList };
