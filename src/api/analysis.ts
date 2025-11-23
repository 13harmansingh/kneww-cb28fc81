/**
 * AI Analysis-related API calls
 */

import { invokeEdgeFunction } from './client';
import { EDGE_FUNCTIONS } from '@/config/constants';
import { ApiRequestOptions, AnalysisResponse } from '@/config/types';

interface AnalyzeNewsParams {
  title: string;
  text: string;
  url: string;
}

export async function analyzeNews(
  params: AnalyzeNewsParams,
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<AnalysisResponse>({
    functionName: EDGE_FUNCTIONS.ANALYZE_NEWS,
    body: params,
    ...options,
  });
}
