/**
 * News-related API calls
 */

import { invokeEdgeFunction } from './client';
import { EDGE_FUNCTIONS } from '@/config/constants';
import { ApiRequestOptions, NewsResponse, AISearchResponse } from '@/config/types';

interface FetchNewsParams {
  state?: string;
  category: string;
  language?: string;
  source_country?: string;
  source_countries?: string;
  searchText?: string;
  entities?: string;
}

export async function fetchNews(
  params: FetchNewsParams,
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<NewsResponse>({
    functionName: EDGE_FUNCTIONS.FETCH_NEWS,
    body: params,
    ...options,
  });
}

interface FetchRelatedNewsParams {
  topic: string;
  language: string;
  source_country: string;
}

export async function fetchRelatedNews(
  params: FetchRelatedNewsParams,
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<NewsResponse>({
    functionName: EDGE_FUNCTIONS.FETCH_RELATED_NEWS,
    body: params,
    ...options,
  });
}

interface AISearchParams {
  query: string;
  language: string;
}

export async function aiSearchNews(
  params: AISearchParams,
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<AISearchResponse>({
    functionName: EDGE_FUNCTIONS.AI_SEARCH_NEWS,
    body: params,
    ...options,
  });
}
