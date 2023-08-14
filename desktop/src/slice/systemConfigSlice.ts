import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export interface SystemConfigState{
    mode:"dark"|"light"
}
const initialState: SystemConfigState = {
    mode:"light"
}


const systemConfigSlice = createSlice({
    name:"systemConfig",
    initialState:initialState,
    reducers:{
        setMode:(state, action:PayloadAction<"dark"|"light">)=>{
            state.mode = action.payload
            if (localStorage) {
                localStorage.setItem("systemConfig",JSON.stringify(state));
            }
        }
    }
});

let {actions, caseReducers, getInitialState, name, reducer} = systemConfigSlice;

let {setMode} = actions;

export {reducer,setMode}