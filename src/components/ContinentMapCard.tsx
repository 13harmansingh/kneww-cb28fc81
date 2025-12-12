import { Region } from "@/data/countries";
import { FollowStateButton } from "@/components/follow/FollowStateButton";
import { StaticMapImage } from "@/components/StaticMapImage";

interface ContinentMapCardProps {
  region: Region;
  onClick: () => void;
}

// Zoom levels based on region size
const REGION_ZOOM_LEVELS: Record<string, number> = {
  "north-america": 3,
  "south-america": 3,
  "europe": 3.5,
  "africa": 3,
  "asia": 2.5,
  "oceania": 3,
  "middle-east": 4,
};

export const ContinentMapCard = ({ region, onClick }: ContinentMapCardProps) => {
  const zoom = REGION_ZOOM_LEVELS[region.id] || 3;

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-accent transition-all group"
    >
      <StaticMapImage
        coordinates={region.coordinates}
        zoom={zoom}
        width={400}
        height={224}
        className="h-56 w-full"
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{region.icon}</span>
            <div>
              <h3 className="text-xl font-semibold text-foreground group-hover:text-accent transition">
                {region.name}
              </h3>
              <p className="text-sm text-muted-foreground">Click to explore countries</p>
            </div>
          </div>
          <FollowStateButton
            stateCode={region.id}
            stateName={region.name}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
};
