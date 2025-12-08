import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Newspaper, Sparkles, Bookmark, Map, Heart, ChevronRight, ChevronLeft, X, Check, Plus } from "lucide-react";
import { useFollowManager } from "@/hooks/useFollowManager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Suggested topics for onboarding
const SUGGESTED_TOPICS = [
  { name: "Technology", icon: "💻" },
  { name: "Politics", icon: "🏛️" },
  { name: "Sports", icon: "⚽" },
  { name: "Business", icon: "📈" },
  { name: "Science", icon: "🔬" },
  { name: "Health", icon: "🏥" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Climate", icon: "🌍" },
];

// Suggested regions/states
const SUGGESTED_REGIONS = [
  { name: "California", country: "US", icon: "🌴" },
  { name: "New York", country: "US", icon: "🗽" },
  { name: "Texas", country: "US", icon: "⛪" },
  { name: "Ontario", country: "CA", icon: "🍁" },
  { name: "England", country: "UK", icon: "🏰" },
  { name: "Bavaria", country: "DE", icon: "🏔️" },
];

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const { follow, isFollowing, syncing } = useFollowManager();

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic) 
        : [...prev, topic]
    );
  }, []);

  const toggleRegion = useCallback((region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region) 
        : [...prev, region]
    );
  }, []);

  const handleFollowSelections = async () => {
    // Follow all selected topics
    for (const topic of selectedTopics) {
      if (!isFollowing('topic', topic)) {
        await follow('topic', topic);
      }
    }
    // Follow all selected regions
    for (const region of selectedRegions) {
      if (!isFollowing('state', region)) {
        await follow('state', region);
      }
    }
    
    if (selectedTopics.length > 0 || selectedRegions.length > 0) {
      toast.success(`Following ${selectedTopics.length + selectedRegions.length} interests!`);
    }
  };

  const TOUR_STEPS = [
    {
      id: 1,
      title: "Welcome to KNEW",
      subtitle: "Your intelligent news companion awaits",
      description: "Experience news like never before — curated, analyzed, and personalized just for you.",
      icon: Sparkles,
      gradient: "from-accent/30 to-primary/20",
      interactive: null,
    },
    {
      id: 2,
      title: "Curate Your World",
      subtitle: "Select topics that interest you",
      description: "Tap to follow topics. We'll personalize your news feed based on your selections.",
      icon: Heart,
      gradient: "from-pink-500/20 to-rose-500/20",
      interactive: "topics",
    },
    {
      id: 3,
      title: "Follow Regions",
      subtitle: "Stay updated on locations you care about",
      description: "Follow states and regions to get localized news from anywhere in the world.",
      icon: Globe,
      gradient: "from-cyan-500/20 to-blue-500/20",
      interactive: "regions",
    },
    {
      id: 4,
      title: "Your Daily Brief",
      subtitle: "A personalized newspaper, just for you",
      description: "Every day, we generate a custom newspaper based on your follows. One tap, infinite insights.",
      icon: Newspaper,
      gradient: "from-amber-500/20 to-orange-500/20",
      interactive: "preview",
    },
    {
      id: 5,
      title: "Uncover the Truth",
      subtitle: "AI-powered analysis at your fingertips",
      description: "Tap any article to reveal bias detection, fact-checks, sentiment analysis, and summaries.",
      icon: Sparkles,
      gradient: "from-violet-500/20 to-purple-500/20",
      interactive: null,
    },
    {
      id: 6,
      title: "You're All Set!",
      subtitle: "Begin your journey into informed intelligence",
      description: selectedTopics.length > 0 || selectedRegions.length > 0
        ? `You're following ${selectedTopics.length} topics and ${selectedRegions.length} regions. Your personalized experience awaits!`
        : "Start exploring and follow topics that interest you to personalize your experience.",
      icon: Bookmark,
      gradient: "from-emerald-500/20 to-green-500/20",
      interactive: null,
    },
  ];

  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = async () => {
    if (isLastStep) {
      await handleFollowSelections();
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderInteractiveContent = () => {
    switch (step.interactive) {
      case "topics":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mt-6"
          >
            {SUGGESTED_TOPICS.map((topic) => {
              const isSelected = selectedTopics.includes(topic.name);
              return (
                <motion.button
                  key={topic.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTopic(topic.name)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 font-medium",
                    isSelected
                      ? "bg-accent text-white border-accent"
                      : "bg-secondary/50 text-foreground border-border hover:border-accent/50"
                  )}
                >
                  <span>{topic.icon}</span>
                  <span>{topic.name}</span>
                  {isSelected ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4 opacity-50" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        );

      case "regions":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mt-6"
          >
            {SUGGESTED_REGIONS.map((region) => {
              const isSelected = selectedRegions.includes(region.name);
              return (
                <motion.button
                  key={region.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleRegion(region.name)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 font-medium",
                    isSelected
                      ? "bg-accent text-white border-accent"
                      : "bg-secondary/50 text-foreground border-border hover:border-accent/50"
                  )}
                >
                  <span>{region.icon}</span>
                  <span>{region.name}</span>
                  <span className="text-xs opacity-60">{region.country}</span>
                  {isSelected ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4 opacity-50" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        );

      case "preview":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-card/50 rounded-2xl border border-border p-4 max-w-sm mx-auto"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">Your Daily Brief</p>
                <p className="text-xs text-muted-foreground">Generated fresh each day</p>
              </div>
            </div>
            <div className="space-y-2">
              {selectedTopics.length > 0 || selectedRegions.length > 0 ? (
                <>
                  {selectedTopics.slice(0, 2).map((topic) => (
                    <div key={topic} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-accent"></span>
                      <span>Latest {topic} news...</span>
                    </div>
                  ))}
                  {selectedRegions.slice(0, 2).map((region) => (
                    <div key={region} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span>Updates from {region}...</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Follow topics and regions to see your personalized preview!
                </p>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-y-auto"
    >
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 20, -30, 0],
            scale: [1, 0.95, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        />
      </div>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="relative z-10 max-w-lg w-full flex flex-col items-center py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full text-center"
          >
            {/* Icon container */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className={`w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${step.gradient} flex items-center justify-center border border-border/50 shadow-2xl`}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className="w-12 h-12 text-foreground" />
              </motion.div>
            </motion.div>

            {/* Text content */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-bold text-foreground mb-2"
            >
              {step.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-accent font-medium mb-3"
            >
              {step.subtitle}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-muted-foreground leading-relaxed text-sm"
            >
              {step.description}
            </motion.p>

            {/* Interactive content */}
            {renderInteractiveContent()}

            {/* Selection count badge */}
            {(step.interactive === "topics" || step.interactive === "regions") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-sm text-muted-foreground"
              >
                {step.interactive === "topics" && selectedTopics.length > 0 && (
                  <span className="text-accent font-medium">{selectedTopics.length} topics selected</span>
                )}
                {step.interactive === "regions" && selectedRegions.length > 0 && (
                  <span className="text-accent font-medium">{selectedRegions.length} regions selected</span>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-8 mb-6">
          {TOUR_STEPS.map((_, index) => (
            <motion.div
              key={index}
              animate={{
                scale: index === currentStep ? 1.3 : 1,
                backgroundColor: index === currentStep 
                  ? "hsl(var(--accent))" 
                  : index < currentStep 
                    ? "hsl(var(--accent) / 0.5)"
                    : "hsl(var(--muted))",
              }}
              transition={{ duration: 0.2 }}
              className="w-2 h-2 rounded-full"
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-4 w-full max-w-md">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex-1 py-3 px-6 rounded-xl border border-border text-foreground font-medium hover:bg-secondary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={syncing}
            className="flex-1 py-3 px-6 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {syncing ? (
              <>
                Saving...
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              </>
            ) : isLastStep ? (
              <>
                Begin Your Journey
                <Sparkles className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>

        {/* Step indicator */}
        <p className="mt-4 text-sm text-muted-foreground">
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </p>
      </div>
    </motion.div>
  );
}
