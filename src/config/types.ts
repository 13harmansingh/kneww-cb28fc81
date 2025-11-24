/**
 * Shared types for API responses and application data
 */

export interface ApiResponse<T = any> {
  data: T | null;
  error: ApiError | null;
  status: 'success' | 'error' | 'rate_limited' | 'auth_error';
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiRequestOptions {
  signal?: AbortSignal;
  onRateLimited?: () => void;
  onAuthError?: () => void;
  suppressErrors?: boolean;
}

export interface Claim {
  text: string;
  verification: 'verified' | 'unverified' | 'false';
  explanation: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  text: string;
  url: string;
  image?: string;
  source_country: string;
  language: string;
  publish_date: string;
  authors?: string[];
  category?: string[];
  bias?: string;
  summary?: string;
  ownership?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  claims?: Claim[];
}

export interface AvailableLanguage {
  code: string;
  name: string;
  count: number;
}

export interface NewsResponse {
  news: NewsArticle[];
  available_languages: AvailableLanguage[];
  default_language: string;
  status: string;
}

export interface AnalysisResponse {
  bias?: string;
  summary?: string;
  ownership?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  claims?: Claim[];
}

export interface TranslationResponse {
  title: string;
  text: string;
  summary?: string;
  bias?: string;
  ownership?: string;
}

export interface AISearchResponse {
  articles: NewsArticle[];
  entities: string[];
  searchText: string;
}
