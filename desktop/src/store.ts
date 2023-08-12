import {Action, configureStore, ThunkAction} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { reducer as projectReducer } from "./slice/projectSlice";
import { reducer as expectationReducer } from "./slice/expectationSlice";
import { reducer as logReducer } from "./slice/logSlice";
import { reducer as systemConfigReducer } from "./slice/systemConfigSlice";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    expectation: expectationReducer,
    log:logReducer,
    systemConfig:systemConfigReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, undefined, Action<string>>;


export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
