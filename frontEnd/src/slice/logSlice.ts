import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import { LogM,LogFilterM } from "core/struct/log"

export interface LogState{
    logList:Array<LogM>;
    logFilter:Array<LogFilterM>
}

export const logSlice = createSlice({
    name:"log",
    initialState:{
        logList:[],
        logFilter:[]
    } as LogState,
    reducers:{
        setLogList(state,action:PayloadAction<Array<LogM>>){
            state.logList = action.payload;
        },
        addLogFilter(state,action:PayloadAction<LogFilterM>){
            state.logFilter.push(action.payload);
        },
        removeLogFilter(state,action:PayloadAction<string>){
            state.logFilter = state.logFilter.filter(item => item.id !== action.payload);
        }
    }
});

let {actions, caseReducers, getInitialState, name, reducer} = logSlice;

let {addLogFilter, removeLogFilter, setLogList} = actions;


export {addLogFilter,removeLogFilter,setLogList,reducer}
