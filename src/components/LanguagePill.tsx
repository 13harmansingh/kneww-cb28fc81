import { cn } from "@/lib/utils";
interface LanguagePillProps {
  code: string;
  name: string;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
}
export const LanguagePill = ({
  code,
  name,
  count,
  isActive,
  onClick
}: LanguagePillProps) => {
  return <button onClick={onClick} className={cn("px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2", isActive ? "bg-accent text-accent-foreground border-accent shadow-lg" : "bg-card/50 text-muted-foreground border-border/50 hover:bg-accent/20 hover:border-accent/50")}>
      <span>{name}</span>
      
    </button>;
};