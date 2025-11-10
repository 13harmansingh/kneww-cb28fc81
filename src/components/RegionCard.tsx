import { Region } from "@/data/countries";

interface RegionCardProps {
  region: Region;
  onClick: () => void;
}

export const RegionCard = ({ region, onClick }: RegionCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-accent transition-all group"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl">{region.icon}</div>
        <h3 className="text-xl font-semibold text-white group-hover:text-accent transition">
          {region.name}
        </h3>
        <p className="text-sm text-muted-foreground text-center">
          Click to explore countries
        </p>
      </div>
    </div>
  );
};
