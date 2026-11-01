import { ProjectM } from "livemock-core/struct/project";
import { createSlice, Draft, PayloadAction } from "@reduxjs/toolkit";

interface ProjectState {
  projectList: Array<ProjectM>;
  currentProjectId: string | null;
}
const initialState: ProjectState = {
  projectList: [],
  currentProjectId: null,
}

const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    setProjectList: (state, action: PayloadAction<Array<ProjectM>>) => {
      state.projectList = action.payload;
    },
    setCurrentProjectId: (state, action: PayloadAction<string>) => {
      state.currentProjectId = action.payload;
    },
  },
});

let { actions, caseReducers, getInitialState, name, reducer } = projectSlice;
let { setProjectList, setCurrentProjectId } = actions;

export { reducer, setProjectList, setCurrentProjectId };
