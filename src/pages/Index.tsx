import { Search, Bell, ArrowRight } from "lucide-react";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { NewsCard } from "@/components/NewsCard";
import { CategoryPill } from "@/components/CategoryPill";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("Technology");

  const categories = ["Politics", "Sports", "Technology", "Entertainment"];

  const breakingNews = [
    {
      id: "1",
      title: "[Exclusive] WhatsApp Starts Testing Meta AI in India With Select Users",
      gradient: "bg-gradient-to-br from-green-300 via-blue-400 to-purple-400",
    },
    {
      id: "2",
      title: "iPhone 17 Pro Models to Arrive in 2025 With 2nm Chipset Built by TSMC: Report",
      gradient: "bg-gradient-to-br from-gray-700 to-gray-900",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Search */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-secondary border border-border rounded-full py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button className="text-foreground">
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Breaking News Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-white">Breaking News</h2>
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {breakingNews.map((news) => (
            <NewsCard key={news.id} {...news} />
          ))}
        </div>
      </div>

      {/* Explore Categories */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-white">Explore Categories</h2>
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => (
            <CategoryPill
              key={category}
              label={category}
              isActive={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl overflow-hidden">
          <img
            src="/placeholder.svg"
            alt="Featured"
            className="w-full h-64 object-cover"
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
