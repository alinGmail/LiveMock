import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  username: string;
}

const initialState: AuthState = {
  username: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
  },
});

const { actions, reducer } = authSlice;
const { setUsername } = actions;

export { reducer, setUsername };
