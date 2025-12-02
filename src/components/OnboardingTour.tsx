import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Newspaper, Sparkles, Bookmark, Map, Heart, ChevronRight, ChevronLeft, X } from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS = [
  {
    id: 1,
    title: "Welcome to KNEW",
    subtitle: "Your intelligent news companion awaits",
    description: "Experience news like never before — curated, analyzed, and personalized just for you.",
    icon: Sparkles,
    gradient: "from-accent/30 to-primary/20",
  },
  {
    id: 2,
    title: "Curate Your World",
    subtitle: "Follow what matters to you",
    description: "Follow states, countries, and topics. We'll curate news based on your unique interests.",
    icon: Heart,
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: 3,
    title: "Your Daily Brief",
    subtitle: "A personalized newspaper, just for you",
    description: "Every day, we generate a custom newspaper based on your follows. One tap, infinite insights.",
    icon: Newspaper,
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: 4,
    title: "Uncover the Truth",
    subtitle: "AI-powered analysis at your fingertips",
    description: "Tap any article to reveal bias detection, fact-checks, sentiment analysis, and summaries.",
    icon: Sparkles,
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: 5,
    title: "Build Your Library",
    subtitle: "Save articles for later",
    description: "Bookmark articles to build your personal intelligence archive. Access them anytime, anywhere.",
    icon: Bookmark,
    gradient: "from-emerald-500/20 to-green-500/20",
  },
  {
    id: 6,
    title: "Navigate the Globe",
    subtitle: "Explore stories from every corner",
    description: "Use our interactive map to discover news from any country or region in the world.",
    icon: Map,
    gradient: "from-violet-500/20 to-purple-500/20",
  },
];

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
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

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center p-6"
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
      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
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
              className={`w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${step.gradient} flex items-center justify-center border border-border/50 shadow-2xl`}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className="w-16 h-16 text-foreground" />
              </motion.div>
            </motion.div>

            {/* Text content */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              {step.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-accent font-medium mb-4"
            >
              {step.subtitle}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-muted-foreground leading-relaxed"
            >
              {step.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-12 mb-8">
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
        <div className="flex items-center gap-4 w-full">
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
            className="flex-1 py-3 px-6 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            {isLastStep ? (
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
        <p className="mt-6 text-sm text-muted-foreground">
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </p>
      </div>
    </motion.div>
  );
}
