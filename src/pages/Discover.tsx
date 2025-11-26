import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, MapPin } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useFollowManager } from "@/hooks/useFollowManager";
import { TrendingTopicCard } from "@/components/discover/TrendingTopicCard";
import { PopularStateCard } from "@/components/discover/PopularStateCard";
import { US_STATES } from "@/data/usStates";
import { CANADA_PROVINCES } from "@/data/canadaProvinces";
import { AUSTRALIA_STATES } from "@/data/australiaStates";
import { INDIA_STATES } from "@/data/indiaStates";

const TRENDING_TOPICS = [
  { id: 'technology', name: 'Technology', icon: '💻', description: 'AI, startups, gadgets & innovation' },
  { id: 'politics', name: 'Politics', icon: '🏛️', description: 'Government, elections & policy' },
  { id: 'sports', name: 'Sports', icon: '⚽', description: 'Games, athletes & competitions' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', description: 'Movies, music & celebrities' },
  { id: 'business', name: 'Business', icon: '💼', description: 'Markets, economy & finance' },
  { id: 'health', name: 'Health', icon: '🏥', description: 'Medical news & wellness' },
  { id: 'science', name: 'Science', icon: '🔬', description: 'Research & discoveries' },
  { id: 'climate', name: 'Climate', icon: '🌍', description: 'Environment & sustainability' },
];

// Most popular states for quick discovery
const POPULAR_US_STATES = ['CA', 'NY', 'TX', 'FL'];
const POPULAR_CANADA_PROVINCES = ['ON', 'QC', 'BC'];
const POPULAR_AUSTRALIA_STATES = ['NSW', 'VIC', 'QLD'];
const POPULAR_INDIA_STATES = ['MH', 'DL', 'KA', 'TN'];

const Discover = () => {
  const { follows } = useFollowManager();

  const followedTopics = follows.filter(f => f.follow_type === 'topic');
  const followedStates = follows.filter(f => f.follow_type === 'state');

  const popularUSStates = US_STATES.filter(s => POPULAR_US_STATES.includes(s.code));
  const popularCanadaProvinces = CANADA_PROVINCES.filter(s => POPULAR_CANADA_PROVINCES.includes(s.code));
  const popularAustraliaStates = AUSTRALIA_STATES.filter(s => POPULAR_AUSTRALIA_STATES.includes(s.code));
  const popularIndiaStates = INDIA_STATES.filter(s => POPULAR_INDIA_STATES.includes(s.code));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-7 h-7 text-accent" />
            <h1 className="text-3xl font-bold text-white">Discover</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Find trending topics and popular locations to follow
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-12">
        {/* Your Following Summary */}
        {(followedTopics.length > 0 || followedStates.length > 0) && (
          <div className="bg-secondary/30 border border-accent/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Your Following
            </h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{followedTopics.length} topics</p>
              <p>{followedStates.length} states/locations</p>
            </div>
          </div>
        )}

        {/* Trending Topics Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent" />
            Trending Topics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRENDING_TOPICS.map((topic) => (
              <TrendingTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </section>

        {/* Popular US States */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-accent" />
            Popular US States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularUSStates.map((state) => (
              <PopularStateCard key={state.code} stateCode={state.code} stateName={state.name} />
            ))}
          </div>
        </section>

        {/* Popular Canadian Provinces */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-accent" />
            Popular Canadian Provinces
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularCanadaProvinces.map((province) => (
              <PopularStateCard key={province.code} stateCode={province.code} stateName={province.name} />
            ))}
          </div>
        </section>

        {/* Popular Australian States */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-accent" />
            Popular Australian States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularAustraliaStates.map((state) => (
              <PopularStateCard key={state.code} stateCode={state.code} stateName={state.name} />
            ))}
          </div>
        </section>

        {/* Popular Indian States */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-accent" />
            Popular Indian States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularIndiaStates.map((state) => (
              <PopularStateCard key={state.code} stateCode={state.code} stateName={state.name} />
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Discover;
