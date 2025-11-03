import { Bookmark } from "lucide-react";
import { Link } from "react-router-dom";

interface NewsCardProps {
  id: string;
  title: string;
  image?: string;
  gradient?: string;
  size?: "large" | "small";
}

export const NewsCard = ({ id, title, image, gradient, size = "large" }: NewsCardProps) => {
  return (
    <Link to={`/article/${id}`}>
      <div className={cn(
        "flex-shrink-0 rounded-2xl overflow-hidden",
        size === "large" ? "w-80" : "w-60"
      )}>
        <div className={cn(
          "relative rounded-2xl overflow-hidden",
          size === "large" ? "h-64" : "h-48"
        )}>
          {gradient ? (
            <div className={cn("w-full h-full", gradient)} />
          ) : image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500" />
          )}
        </div>
        <div className="mt-3 space-y-2">
          <h3 className="text-white font-medium line-clamp-3 leading-snug">{title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-accent text-sm">Read more</span>
            <button className="text-white hover:text-accent transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
