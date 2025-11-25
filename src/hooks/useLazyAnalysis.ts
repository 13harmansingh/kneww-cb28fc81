import { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeNews } from '@/api/analysis';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisResult {
  bias?: string;
  summary?: string;
  ownership?: string;
  sentiment?: string;
  claims?: any[];
  analyzing?: boolean;
}

const analysisCache = new Map<string, AnalysisResult>();
const inProgressAnalysis = new Map<string, Promise<AnalysisResult>>();

export const useLazyAnalysis = (
  articleId: string,
  articleUrl: string,
  articleTitle: string,
  articleText?: string
) => {
  const [analysis, setAnalysis] = useState<AnalysisResult>(() => {
    // Check memory cache first
    return analysisCache.get(articleUrl) || { analyzing: false };
  });
  
  const hasStartedRef = useRef(false);

  const triggerAnalysis = useCallback(async () => {
    if (!articleText || !articleUrl || hasStartedRef.current) return;
    
    hasStartedRef.current = true;

    // Check memory cache
    const cached = analysisCache.get(articleUrl);
    if (cached && !cached.analyzing) {
      setAnalysis(cached);
      return;
    }

    // Check if already in progress
    const inProgress = inProgressAnalysis.get(articleUrl);
    if (inProgress) {
      const result = await inProgress;
      setAnalysis(result);
      return;
    }

    // Check database cache
    try {
      const { data: cacheData } = await supabase
        .from('ai_analysis_cache')
        .select('analysis')
        .eq('article_url', articleUrl)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cacheData?.analysis) {
        const result = cacheData.analysis as AnalysisResult;
        analysisCache.set(articleUrl, result);
        setAnalysis(result);
        return;
      }
    } catch (error) {
      // Cache miss, continue to analysis
    }

    // Start analysis
    setAnalysis({ analyzing: true });

    const analysisPromise = (async () => {
      try {
        const response = await analyzeNews({
          title: articleTitle,
          text: articleText,
          url: articleUrl,
        });

        if (response.error) {
          console.error('Analysis error:', response.error);
          return { analyzing: false };
        }

        const result = {
          bias: response.data?.bias,
          summary: response.data?.summary,
          ownership: response.data?.ownership,
          sentiment: response.data?.sentiment,
          claims: response.data?.claims,
          analyzing: false,
        };

        analysisCache.set(articleUrl, result);
        return result;
      } catch (error) {
        console.error('Analysis failed:', error);
        return { analyzing: false };
      } finally {
        inProgressAnalysis.delete(articleUrl);
      }
    })();

    inProgressAnalysis.set(articleUrl, analysisPromise);
    const result = await analysisPromise;
    setAnalysis(result);
  }, [articleUrl, articleTitle, articleText]);

  return {
    analysis,
    triggerAnalysis,
    isAnalyzing: analysis.analyzing || false,
    hasAnalysis: hasStartedRef.current || !!analysis.bias || !!analysis.summary,
  };
};
