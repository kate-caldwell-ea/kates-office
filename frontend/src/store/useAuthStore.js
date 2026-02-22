import { create } from 'zustand';
import { API_URL } from '../config';

const useAuthStore = create((set) => ({
  // State
  isAuthenticated: false,
  authRequired: true,
  isLoading: true,
  error: null,

  // Check authentication status
  checkAuth: async () => {
    try {
      const res = await fetch(`${API_URL}/auth/check`, {
        credentials: 'include'
      });
      const data = await res.json();
      set({
        isAuthenticated: data.authenticated,
        authRequired: data.authRequired,
        isLoading: false
      });
      return data.authenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ isLoading: false, error: 'Failed to check auth status' });
      return false;
    }
  },

  // Login with password
  login: async (password) => {
    set({ error: null });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        set({ isAuthenticated: true, error: null });
        return true;
      } else {
        set({ error: data.error || 'Invalid password' });
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      set({ error: 'Failed to connect to server' });
      return false;
    }
  },

  // Logout
  logout: async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    set({ isAuthenticated: false });
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useAuthStore;
