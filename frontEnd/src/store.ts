import {Action, configureStore, ThunkAction} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { reducer as projectReducer } from "./slice/projectSlice";
import { reducer as expectationReducer } from "./slice/expectationSlice";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    expectation: expectationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, undefined, Action<string>>;


export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
