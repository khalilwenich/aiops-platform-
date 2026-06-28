import { createSlice } from '@reduxjs/toolkit';

const stored = localStorage.getItem('user');
const initialUser = stored ? JSON.parse(stored) : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    accessToken: localStorage.getItem('accessToken') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
  },
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
