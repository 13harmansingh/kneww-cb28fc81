import { motion } from 'framer-motion';
import { Newspaper, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { useDailyNewspaper } from '@/hooks/useDailyNewspaper';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { ArticleItem } from './ArticleItem';

export const DailyNewspaper = () => {
  const { newspaper, loading, generating, error, canGenerate, generateNewspaper } = useDailyNewspaper();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Newspaper className="w-6 h-6 text-accent" />
          <h3 className="text-xl font-semibold text-foreground">Your Daily Brief</h3>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </motion.div>
    );
  }

  // State 1: No newspaper yet / Failed - Show generate button
  if (canGenerate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-accent/10 via-card/50 to-card/30 backdrop-blur-sm border border-accent/20 rounded-xl p-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <Newspaper className="w-7 h-7 text-accent" />
          <h3 className="text-2xl font-bold text-foreground">Your Daily Brief</h3>
        </div>
        
        <p className="text-muted-foreground mb-6 text-lg">
          Your personalized morning edition awaits. One tap to generate.
        </p>

        {error && (
          <p className="text-destructive text-sm mb-4">{error}</p>
        )}

        <Button
          onClick={generateNewspaper}
          disabled={generating}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Today's Edition
        </Button>
      </motion.div>
    );
  }

  // State 2: Generating - Show progress
  if (generating || newspaper?.generation_status === 'generating') {
    const progress = newspaper?.generation_progress;
    const percentage = progress ? Math.round((progress.step / progress.total) * 100) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/50 backdrop-blur-sm border border-accent/30 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Newspaper className="w-6 h-6 text-accent animate-pulse" />
          <h3 className="text-xl font-semibold text-foreground">Your Daily Brief</h3>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-accent font-medium">{progress?.message || 'Initializing...'}</p>
          
          <Progress value={percentage} className="h-2" />
          
          <p className="text-sm text-muted-foreground text-right">{percentage}%</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>This may take a moment...</span>
        </div>
      </motion.div>
    );
  }

  // State 3: Complete - Show articles
  if (newspaper?.generation_status === 'complete') {
    const articles = newspaper.articles || [];
    const generatedTime = new Date(newspaper.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Newspaper className="w-6 h-6 text-accent" />
              <h3 className="text-xl font-semibold text-foreground">Today's Daily Brief</h3>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Generated at {generatedTime}
          </p>

          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
            <p className="text-accent font-medium">
              ✨ {articles.length} articles curated for you
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Want more? Come back tomorrow! 🌅
            </p>
          </div>
        </div>

        {/* Articles list */}
        <div className="space-y-3">
          {articles.map((article: any, index: number) => (
            <motion.div
              key={article.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ArticleItem 
                article={article}
                isSelected={false}
                userLanguage="en"
                translating={{}}
                onTranslate={() => {}}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
};
