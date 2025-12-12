import { Country } from "@/data/countries";
import { FollowStateButton } from "@/components/follow/FollowStateButton";
import { StaticMapImage } from "@/components/StaticMapImage";

interface CountryMapCardProps {
  country: Country;
  onClick: () => void;
}

export const CountryMapCard = ({ country, onClick }: CountryMapCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-accent transition-all group"
    >
      <StaticMapImage
        coordinates={country.coordinates}
        zoom={3}
        width={400}
        height={192}
        className="h-48 w-full"
      />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition">
              {country.name}
            </h3>
            <p className="text-sm text-muted-foreground">Click to view news</p>
          </div>
          <FollowStateButton
            stateCode={country.code}
            stateName={country.name}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
};
