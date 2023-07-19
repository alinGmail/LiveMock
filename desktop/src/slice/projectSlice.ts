import { ProjectM } from "core/struct/project";
import { createSlice } from "@reduxjs/toolkit";

interface ProjectState {
  projectList: Array<ProjectM>;
  curProjectIndex: number;
}
const initialState :ProjectState ={
    projectList: [],
    curProjectIndex: 0,
}

const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
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
