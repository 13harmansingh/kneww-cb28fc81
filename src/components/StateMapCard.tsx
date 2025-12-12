import { USState } from "@/data/usStates";
import { FollowStateButton } from "@/components/follow/FollowStateButton";
import { StaticMapImage } from "@/components/StaticMapImage";

interface StateMapCardProps {
  state: USState;
  onClick: () => void;
}

export const StateMapCard = ({ state, onClick }: StateMapCardProps) => {
  // Defensive check - return null if state is undefined
  if (!state) return null;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden border border-accent/20 hover:border-accent transition-all hover:scale-[1.02] active:scale-95"
    >
      <StaticMapImage
        coordinates={state.coordinates}
        zoom={state.zoom}
        width={400}
        height={192}
        className="w-full h-48"
      />
      <div className="bg-card p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{state.name}</h3>
            <p className="text-sm text-muted-foreground">{state.code}</p>
          </div>
          <FollowStateButton
            stateCode={state.code}
            stateName={state.name}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>
    </button>
  );
};
