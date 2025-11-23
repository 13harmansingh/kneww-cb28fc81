/**
 * Application-wide constants and configuration
 */

// API Configuration
export const API_CONFIG = {
  RATE_LIMIT_RETRY_DELAY: 5000,
  REQUEST_TIMEOUT: 30000,
  DEBOUNCE_DELAY: 500,
  MIN_REQUEST_INTERVAL: 1500,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  NEWS_DURATION: 10 * 60 * 1000, // 10 minutes
  ANALYSIS_DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required. Please sign in to continue.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again in a few moments.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  NO_DATA: 'No data available.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_LOADED: 'Data loaded successfully',
  BOOKMARK_ADDED: 'Article bookmarked',
  BOOKMARK_REMOVED: 'Bookmark removed',
  TRANSLATION_COMPLETE: 'Translation complete',
} as const;

// Telemetry Event Types
export const TELEMETRY_EVENTS = {
  API_CALL: 'api.call',
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',
  RATE_LIMIT: 'rate_limit.exceeded',
  AUTH_FAILURE: 'auth.failure',
  ERROR: 'error',
  USER_ACTION: 'user.action',
} as const;

// Edge Function Names
export const EDGE_FUNCTIONS = {
  FETCH_NEWS: 'fetch-news',
  ANALYZE_NEWS: 'analyze-news',
  TRANSLATE_ARTICLE: 'translate-article',
  AI_SEARCH_NEWS: 'ai-search-news',
  FETCH_RELATED_NEWS: 'fetch-related-news',
} as const;
