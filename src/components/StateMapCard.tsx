import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { USState } from "@/data/usStates";
import { FollowStateButton } from "@/components/follow/FollowStateButton";

interface StateMapCardProps {
  state: USState;
  onClick: () => void;
}

export const StateMapCard = ({ state, onClick }: StateMapCardProps) => {
  // Defensive check - return null if state is undefined
  if (!state) return null;
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px" }
    );

    observer.observe(mapContainer.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !isVisible) return;

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || "";
    
    if (!MAPBOX_TOKEN) {
      console.error("Mapbox token not found");
      return;
    }

    // Clean up existing map before creating new one
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    // Add small delay to ensure proper cleanup
    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const mapStyle = "mapbox://styles/mapbox/outdoors-v12";

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: state.coordinates,
        zoom: state.zoom,
        interactive: false,
        attributionControl: false,
      });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [state.code, state.coordinates, state.zoom, isVisible]);

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group relative"
    >
      <div className="relative">
        <div ref={mapContainer} className="h-44 w-full bg-muted/20 map-container-teal" />
        <div className="absolute bottom-3 left-3 z-10">
          <FollowStateButton
            stateCode={state.code}
            stateName={state.name}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition truncate">
          {state.name}
        </h3>
      </div>
    </div>
  );
};
