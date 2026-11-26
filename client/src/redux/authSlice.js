import { createSlice } from '@reduxjs/toolkit';

const stored = (() => {
  try {
    const raw = localStorage.getItem('erp_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const initialState = {
  user: stored?.user ?? null,
  token: stored?.token ?? null,
  permissions: stored?.permissions ?? [],
  roles: stored?.roles ?? [],
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, token, permissions, roles } = action.payload;
      state.user = user;
      state.token = token;
      state.permissions = permissions ?? [];
      state.roles = roles ?? [];
      localStorage.setItem('erp_auth', JSON.stringify({ user, token, permissions, roles }));
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      const stored = JSON.parse(localStorage.getItem('erp_auth') || '{}');
      localStorage.setItem('erp_auth', JSON.stringify({ ...stored, user: state.user }));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.permissions = [];
      state.roles = [];
      localStorage.removeItem('erp_auth');
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectPermissions = (state) => state.auth.permissions;
export const selectRoles = (state) => state.auth.roles;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const hasPermission = (state, perm) => state.auth.permissions?.includes(perm);
export const hasRole = (state, role) => state.auth.roles?.includes(role);
