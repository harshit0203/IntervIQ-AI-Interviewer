import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

const initialState = {
  user: null,
  token: null,
  expiresAt: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { user, token, expiresIn } = action.payload;

      if (user) state.user = user;

      if (token) {
        state.token = token;
        const expiryTime = expiresIn
          ? Date.now() + expiresIn * 1000
          : state.expiresAt || null;
        state.expiresAt = expiryTime;
        state.isAuthenticated = true;

        Cookies.set("auth_token", token, {
          expires: expiresIn ? expiresIn / 86400 : 7,
          secure: true,
          sameSite: "Strict",
        });
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.expiresAt = null;
      state.isAuthenticated = false;
      Cookies.remove("auth_token");
    },

    checkExpiry: (state) => {
      if (state.expiresAt && Date.now() > state.expiresAt) {
        state.user = null;
        state.token = null;
        state.expiresAt = null;
        state.isAuthenticated = false;
        Cookies.remove("auth_token");
      }
    },
  },
});

export const { setUser, logout, checkExpiry } = userSlice.actions;
export default userSlice.reducer;
