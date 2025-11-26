import { cn } from "@/lib/utils";
import { FollowTopicButton } from "@/components/follow/FollowTopicButton";

interface CategoryPillProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const CategoryPill = ({ label, isActive, onClick }: CategoryPillProps) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        className={cn(
          "px-6 py-2.5 rounded-full border border-accent/30 text-sm font-medium transition-all whitespace-nowrap",
          isActive
            ? "bg-accent/20 text-accent border-accent"
            : "bg-transparent text-accent/70 hover:bg-accent/10"
        )}
      >
        {label}
      </button>
      {label.toLowerCase() !== 'all' && (
        <FollowTopicButton 
          topic={label.toLowerCase()}
          size="sm"
          variant="ghost"
        />
      )}
    </div>
  );
};
