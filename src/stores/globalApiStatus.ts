/**
 * Global API status store for managing rate limits, errors, and loading states
 */

import { create } from 'zustand';

interface GlobalApiStatus {
  isRateLimited: boolean;
  authError: boolean;
  serverError: string | null;
  loading: boolean;
  
  setRateLimited: (value: boolean) => void;
  setAuthError: (value: boolean) => void;
  setServerError: (error: string | null) => void;
  setLoading: (value: boolean) => void;
  reset: () => void;
}

export const useGlobalApiStatus = create<GlobalApiStatus>((set) => ({
  isRateLimited: false,
  authError: false,
  serverError: null,
  loading: false,

  setRateLimited: (value) => set({ isRateLimited: value }),
  setAuthError: (value) => set({ authError: value }),
  setServerError: (error) => set({ serverError: error }),
  setLoading: (value) => set({ loading: value }),
  reset: () => set({
    isRateLimited: false,
    authError: false,
    serverError: null,
    loading: false,
  }),
}));
