/**
 * Translation-related API calls
 */

import { invokeEdgeFunction } from './client';
import { EDGE_FUNCTIONS } from '@/config/constants';
import { ApiRequestOptions, TranslationResponse } from '@/config/types';

interface TranslateArticleParams {
  title: string;
  text: string;
  summary?: string;
  bias?: string;
  ownership?: string;
  claims?: Array<{ text: string; verification: string; explanation: string }>;
  targetLanguage: string;
}

export async function translateArticle(
  params: TranslateArticleParams,
  options: ApiRequestOptions = {}
) {
  return invokeEdgeFunction<TranslationResponse>({
    functionName: EDGE_FUNCTIONS.TRANSLATE_ARTICLE,
    body: params,
    ...options,
  });
}
