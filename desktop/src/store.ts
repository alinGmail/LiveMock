import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { reducer as projectReducer } from "./slice/projectSlice";
import { reducer as expectationReducer } from "./slice/expectationSlice";
import { reducer as logReducer } from "./slice/logSlice";
import {reducer as systemConfigReducer, setMode} from "./slice/systemConfigSlice";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    expectation: expectationReducer,
    log: logReducer,
    systemConfig: systemConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  undefined,
  Action<string>
>;
if (localStorage) {
  const systemConfig = localStorage.getItem("systemConfig");
  if (systemConfig) {
    try {
      const sysCon = JSON.parse(systemConfig);
      const mode = sysCon.mode ? sysCon.mode : "light";
      store.dispatch(setMode(mode));
    } catch (e) {}
  }
}
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
