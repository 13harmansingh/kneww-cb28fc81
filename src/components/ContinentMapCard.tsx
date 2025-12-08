import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Region } from "@/data/countries";
import { FollowStateButton } from "@/components/follow/FollowStateButton";

const MAPBOX_TOKEN = "pk.eyJ1IjoicjR3Y2xvIiwiYSI6ImNtOHFwNmhzbzBsdXcyanNjcmhjdm9hOGsifQ.7XhOgtfnTOl8qKZZNgMMLw";

interface ContinentMapCardProps {
  region: Region;
  onClick: () => void;
}

export const ContinentMapCard = ({ region, onClick }: ContinentMapCardProps) => {
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

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Determine zoom level based on region size
    const zoomLevels: Record<string, number> = {
      "north-america": 3,
      "south-america": 3,
      "europe": 3.5,
      "africa": 3,
      "asia": 2.5,
      "oceania": 3,
      "middle-east": 4,
    };

    // Add a small delay before initializing map to prevent rapid re-renders
    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: region.coordinates,
        zoom: zoomLevels[region.id] || 3,
        interactive: false,
        attributionControl: false,
        preserveDrawingBuffer: true, // Helps with mobile performance
      });

      map.current.on("style.load", () => {
        map.current?.setFog({
          color: "rgb(25, 25, 40)",
          "high-color": "rgb(50, 50, 80)",
          "horizon-blend": 0.2,
        });
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [region.id, region.coordinates, isVisible]);

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-accent transition-all group"
    >
      <div ref={mapContainer} className="h-56 w-full bg-muted/20" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{region.icon}</span>
            <div>
              <h3 className="text-xl font-semibold text-white group-hover:text-accent transition">
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
