import { createStore } from 'vuex';

export default createStore({
  state: {
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || '', // 如 admin, provider, user
  },
  mutations: {
    setToken(state, token) {
      state.token = token;
      localStorage.setItem('token', token);
    },
    clearToken(state) {
      state.token = '';
      localStorage.removeItem('token');
    },
    setRole(state, role) {
      state.role = role;
      localStorage.setItem('role', role);
    },
    clearRole(state) {
      state.role = '';
      localStorage.removeItem('role');
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.role,
  },
});
//身份状态管理