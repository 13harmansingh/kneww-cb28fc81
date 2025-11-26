import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QueuedRequest {
  id: string;
  params: any;
  timestamp: number;
  retryCount: number;
}

export interface RecoveryTask {
  id: string;
  type: 'fetch-news' | 'analyze-news' | 'api-error' | 'worker-crash';
  params: any;
  retryCount: number;
  nextRetryAt: number;
  maxRetries: number;
  error?: string;
}

interface SystemState {
  // Safe Mode
  crashCount: number;
  lastCrashTime: number;
  safeMode: boolean;
  crashTimestamps: number[];
  
  // Rate Limit Observer
  rateLimited: boolean;
  cooldownUntil: number | null;
  requestQueue: QueuedRequest[];
  
  // Recovery
  recoveryQueue: RecoveryTask[];
  isRecovering: boolean;
  
  // App Settings (cached)
  appSettings: Record<string, any>;
  
  // Actions
  recordCrash: () => void;
  exitSafeMode: () => void;
  setRateLimited: (until: number | null) => void;
  addToRequestQueue: (request: QueuedRequest) => void;
  removeFromRequestQueue: (id: string) => void;
  addToRecoveryQueue: (task: RecoveryTask) => void;
  removeFromRecoveryQueue: (id: string) => void;
  updateRecoveryTask: (id: string, updates: Partial<RecoveryTask>) => void;
  setRecovering: (value: boolean) => void;
  updateAppSettings: (settings: Record<string, any>) => void;
  reset: () => void;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set, get) => ({
      // Initial state
      crashCount: 0,
      lastCrashTime: 0,
      safeMode: false,
      crashTimestamps: [],
      rateLimited: false,
      cooldownUntil: null,
      requestQueue: [],
      recoveryQueue: [],
      isRecovering: false,
      appSettings: {},
      
      // Actions
      recordCrash: () => {
        const now = Date.now();
        const state = get();
        const recentCrashes = state.crashTimestamps.filter(
          timestamp => now - timestamp < 60000 // Last 60 seconds
        );
        
        const newTimestamps = [...recentCrashes, now];
        const newCrashCount = newTimestamps.length;
        
        set({
          crashTimestamps: newTimestamps,
          crashCount: newCrashCount,
          lastCrashTime: now,
          safeMode: newCrashCount >= 3,
        });
      },
      
      exitSafeMode: () => {
        set({
          safeMode: false,
          crashCount: 0,
          crashTimestamps: [],
        });
      },
      
      setRateLimited: (until) => {
        set({
          rateLimited: until !== null && until > Date.now(),
          cooldownUntil: until,
        });
      },
      
      addToRequestQueue: (request) => {
        set((state) => ({
          requestQueue: [...state.requestQueue, request],
        }));
      },
      
      removeFromRequestQueue: (id) => {
        set((state) => ({
          requestQueue: state.requestQueue.filter(r => r.id !== id),
        }));
      },
      
      addToRecoveryQueue: (task) => {
        set((state) => ({
          recoveryQueue: [...state.recoveryQueue, task],
        }));
      },
      
      removeFromRecoveryQueue: (id) => {
        set((state) => ({
          recoveryQueue: state.recoveryQueue.filter(t => t.id !== id),
        }));
      },
      
      updateRecoveryTask: (id, updates) => {
        set((state) => ({
          recoveryQueue: state.recoveryQueue.map(task =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },
      
      setRecovering: (value) => {
        set({ isRecovering: value });
      },
      
      updateAppSettings: (settings) => {
        set({ appSettings: settings });
      },
      
      reset: () => {
        set({
          crashCount: 0,
          lastCrashTime: 0,
          safeMode: false,
          crashTimestamps: [],
          rateLimited: false,
          cooldownUntil: null,
          requestQueue: [],
          recoveryQueue: [],
          isRecovering: false,
        });
      },
    }),
    {
      name: 'knew-system-storage',
      partialize: (state) => ({
        crashTimestamps: state.crashTimestamps,
        safeMode: state.safeMode,
        appSettings: state.appSettings,
      }),
    }
  )
);
